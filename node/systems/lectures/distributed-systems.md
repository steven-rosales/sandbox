# Durable Distributed Systems with Node.js, TypeScript, and PostgreSQL

We've established thus far:

- Runtime: one process, event loop, memory, bytes, streams
- Processes: processes, threads, IPC, isolation, shutdown
- Networking: sockets, protocols, deadlines, retries, network uncertainty

We'll now answer _how do you preserve business correctness when processes crash, requests are duplicated, databases commit independently, and network outcomes are uncertain?_. We will build this:

```txt
POST /orders
  ↓
Order API
  ↓
one PostgreSQL transaction
    -> order now
    -> API idempotency record
    -> outbox event
    ↓
    Outbox dispatcher
    ↓
    ↓ HTTP + stable idempotency key
    ↓
    Provider simulator
    ↓
    -> durable deduplication record
```

We'll continue use Node.js 24 LTS, strict TypeScript, ESM, and `NodeNext`. Node 24 includes stable global `fetch`, `AbortSignal.timeout()`, and `AbortSignal.any()`, which we will use for bounded external calls.

## 1. The Correctness Model

The system will maintain the following invariants:

1. An accepted order and its outbox event either both commit or neither commits.
2. Repeating the same API requests with the same idempotency key returns the same order.
3. Reusing an idempotency key with a different request is rejected.
4. A dispatcher may deliver an event more than once.
5. The provider applies the event's effect at most once per event ID.
6. An outbox event is marked published only after the provider acknowledges the operation.
7. A stale worker cannot overwrite the work of a newer worker lease.

These invariants matter more than the exact frameworks or class structure. The architecture accepts an importan reality:

- transport delivery: possibly repeated
- business side effect: deduplicated by durable identity

We are not trying to prevent every duplicate message. We are making duplicate messages harmless.

## 2. Set up PostgreSQL and the Project

We'll use pg, zod, and @types/pg with npm packages. The compose file is in [compose](../compose.yaml) which composes a postgres service name `ds` with user `ds`. The file starts two schemas which are `app` that contain `order`, `api_idempotency`, and `outbox_events`, and `provider` which conatins `operations`.

The primary keys and unique constraints are not merely validation. They are concurrency-control mechanisms. PostgreSQL guarantees uniqueness across concurrent inserts, and `INSERT ... ON CONFLICT` lets the database arbitrate which caller creates the record.

## 4. Local Transactions are not Distributed Transactions

A PostgreSQL transaction can atomically perform:

- insert order
- insert outbox event
- insert idempotency result

because all three writes live inside the same database transaction. It cannot automatically make '_insert order into PostgreSQL + send HTTP request to another service_' atomic. Those operations belong to independent failure domains.

Consider this implementation:

```ts
await insertOrder(order);
await publishEvent(order);
```

Crash between the two operations: order committed -> event missing. Reversing them is not better:

```ts
await publishEvent(order);
await insertOrder(order);
```

Crash between them: event publish -> order missing. This is the **dual-write problem**.

Holding the database transaction open while performing the network request also does not solve it. The provider can succeed and the database commit can still fail. You also hold locks and a database connection while waiting on an unreliable network.

The transactional outbox changes the second write from '_publish external storage_' to '_store durable intent to publish_'. That durable intent participates in the same local transaction as the order.

In layman, instead of writing of writing to the database and making external calls as two separate, uncoordinated steps, the outbox pattern bundles the state change and the Message to be a single database transaction. An asynchronous background process then reliably reads and publishes the saved event.

## 5. Configuration, Connection Pooling, and Transaction Boundaries

Our configuration is set on [config](../src/distributed-systems/40-config.ts) and the database in [database](../src/distributed-systems/41-database.ts) with a connection pool.

A connection pool is another bounded queuing system:

```txt
application requests
  ↓
connection pool
-> client 1
-> client 2
-> ...
-> client 10

additional callers
  ↓
waiting queue
```

When a `node-postgres` pool has no available client and has reached maximum size, connection requests wait in a FIFO queue. A pool exposes `totalCount`, `idleCount`, and `waitingCount`, which should eventually become operational metrics.

In [transaction](../src/distributed-systems/42-transaction.ts), we show that every statement inside a PostgreSQL transaction must ust the same checked-out client. Calling `pool.query()` independently for statements inside on conceptual transaction can send them to different database connections.

`statement_timeout` bounds total statement execution. `lock_timeout` bounds how long a statement waits to acquire a lock. PostgreSQL also supports transaction-level timeout controls; the key prinicple is that database waiting must be bounded rather than silently infinite.

## 6. Model the Event as a Versioned Protocol

In [domain](../src/distributed-systems/43-domain.ts), we have the event that is a protocol, not merely an internal TypeScript object.

- `eventType`: identifies semantic meaning
- `eventVersion`: identifies payload contract
- `eventId`: durable identity across retries
- `aggregateId`: business entity identity
- `occurredAt`: event creation time

The same event ID must be reused every time this outbox event is retries. Generating a new event ID on each delivery attempt destroy deduplication.

## 7. Create Orders Idempotently

In [create-order](../src/distributed-systems/44-create-order-.ts), we safely create an order with idempotency, a transaction, and creating an outbox for the event.

The database `app.api_idempotency` primary key:

```sql
PRIMARY KEY (
  tenant_id,
  idempotency_key
)
```

is the concurrency arbitrer. Two simultaneous requests using the same key cannot both create independent idempotency rows. The losing request observes the committed result created by the winner. The request hash prevents this mistake:

```txt
Idempotency-Key: checkout-123
body: amount = 1000

later:

Idempotency-Key: checkout-123
body: amount = 5000
```

Returning the original result without detecting the change request would hide a caller bug.

## 8. Expose the Order API

With [api](../src/distributed-systems/45-api.ts), we can test the solution of sending a `POST` request with an idempotency key, tenant id, and a payload.

It can be tested with [api-test](../src/utils/api-http.sh) which curls with the appropiate headers and adata. You should receive the same `orderId`, with `x-idempotency-replayed: true`. Change `amountCents` while preserving the same idempotency key to see a `409` return from the API.

## 9. The Outbox is a Durable State Machine

An outbox moves through:

```txt
PENDING
  ↓ claimed
PROCESSING
-> provider succeeds -> PUBLISHED
-> retryable failure -> PENDING
-> permanent/exhausted -> DEAD
```

The durable database row is the queue. This is not necessarily a replacement for Kafka, SQS, RabbitMQ, or another broker. It is a correctness bridge between them.

```
database transaction
  ↓
event publication

OR

order + outbox
  ↓
outbox relay
  ↓
Kafka/SQS/etc.
  ↓
consumers
```

The outbox still solves the original database-to-broker dual write.

## 10. Claiming Work with Row Locks, Leases, and Fencing Tokens

In [outbox](../src/distributed-systems/46-outbox.ts), we select outbox events which are either pending or processing which have lease expired. In the SQL part, we have `FOR UPDATE SKIP LOCKED` that allows multiple dispatcher processes to claim different rows without waiting on rows already claimed by another dispatcher. PostgreSQL explicitly describes `SKIP LOCKED` as unsuitable for general consistent view, but appropiate for multiple consumers accessing a queue-like table.

The claim transaction must remain short:

```txt
BEGIN
select and lock rows
mark rows processing
COMMIT
```

Do not call the provider while holding the row locks. PostgreSQL row and table locks are generally held until the transaction ends, so a network request inside the claim transaction increases lock duration and connection occupancy.

### Why Both Leases and Fencing Token?

The lease answers, '_when may another worker reclaim this event?_'. The fencing token answer, '_is this worker still newest owner?_'. Example:

```txt
Worker A claims event
lease_token = 1

Worker A pauses for 30 seconds

leases expires

Worker B reclaims event
lease_token = 2

Worker A wakes up and tries to commit
```

Worker A still remembers that it once owned the event. Checking only its worker ID is insufficient. Worker A must update using:

```sql
WHERE lease_token = 1
```

That fails because the current token is now `2`. A monotonically increasing fencing token prevents stale owners from overwriting newer ownership. The difference between a pure optimistic concurrency control and distributed lease management (DSLM) is that the DSLM is **pessimistic** on entry with `FOR UPDATE SKIP LOCKED` to exclusively grab rows without worker collision, which it then does the work (lockless), and finally exists optimistically like `WHERE id = $1 AND lease_token = $2`.

## 11. Build a Durable Idempotent Provider

The provider represents an independent service such as:

- payment processor
- fulfillment system
- pickup scheduler
- email provider
- hardware command gateway

The [provider](../src/distributed-systems/47-provider.ts) lets the table of `provider.operations` act like a durable inbox through the `recordOperation` function. The workflow is as follows:

```txt
                message arrives
                        ↓
      insert message ID under unique constraint
                        ↓
                already exists?
               ↓                ↓
              yes               no
               ↓                ↓
    return stored result    apply effect and store result
```

The provider does not merely remember that the key existed. It also stores the original response, allowing retries to receive the same semantic result.

## 12. Call the Provider with a Deadline

In [provider-client](../src/distributed-systems/48-provider-client.ts), we have a simple function `submitToProvider` that submits an order with the same stable idempotency key and handles dependency errors of timeouts (with `AbortController`) and networking.

Node 24's `AbortSignal.timeout()` creates a signal that aborts after a bounded duration, while `AbortSignal.any()` combines the shutdown and request timeout signals. Its global `fetch` implementation is stable.

The important distinction is, '_Promise rejected != remote operation did not happen_'. A timeout or connection reset can occure:

- before provider receives request
- during provider processing
- after provider commits
- while provider sends response

The caller usually cannot distinguish those cases. **That is why retry safety comes from the stable idempotency key**, not from guessing where the failure occurred.

## 13. Complete or Reschedule Events using Fencing

We create `markPublished` and `markFailure` in an updates [outbox](../src/distributed-systems/46-outbox.ts) to mark an outbox event to be successful or a failure, respectfully. The success updates the order state and marks outbox published, atomically, while the failure handles dead letters, retries with exponential backoffs, and keeps a record of errors.

In the success, if the fencing check fails, the transaction throws and the order state update rolls back.

## 14. Retry Policy is a Business and Protocol Decision

A retry policy needs at leasr four dimensions:

1. Is the operations safe to retry?
2. Is the failure likely transient?
3. How long should we wait?
4. When do we stop?

A reasonable first classification is:

**Usually retryable**:

- connection reset
- connection refused
- timeout
- HTTP 408
- HTTP 429
- HTTP 5xx
- temporary database unavailability

**Usually not retriable without intervention**:

- invalid payload
- authentication failure
- authorization failure
- unsupported event version
- idempotency key reused with different payload
- violated business rule

This is not universal. For example, an HTTP 404 could mean, '_permanently invalid identifier_', or, '_replica has not observed the resource yet_'. The meaning comes from the dependency contract.

### Exponential Backoff

A common upperbound is $C_n = \min(C_{max}, B \cdot 2^{n})$. Then full jitter chooses, $D_n \sim U(0, C_n)$. The randomness prevents many workers from retrying simultaneously after the same outage.

### Retry Budget

Do not let every layer retry independently without coordination:

- HTTP client retries 3 times
- service retries 3 times
- queue retries 8 times

Possible provider calls is $3 \times 3 \times 8 = 72$. Retries amplify load during an outage. Track the total end-to-end retry budget.

## 15. Build the Dispatcher with Bounded Concurrency

We built the `dispatcherLoop` in [dispatcher](../src//distributed-systems/49-dispatcher.ts) which processes an event and either marks it published or marks the failure and fails safely.

The `concurrency` value is a bulkhead. It says, '_maximum provider calls from this dispatcher is 4_'. Without it, a database containing 100,000 pending events could produce 100,000 concurrent HTTP request.

The database pool, dispatcher concurrency, HTTP connection pool, and provider capacity are separate limits. One large limit does not compensate for another saturated resource.

## 16. Walk Through Every Important Crash Point
