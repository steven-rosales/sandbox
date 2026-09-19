# Observability, Diagnostics, Native Integration, and Local Edge Agents

The last four lectures have taught us:

- runtime, event loop, memory, buffers, streams
- processes, workers, IPC, isolation, shutdown
- networking, protocols, deadlines, retries
- transactions, idempotency, outbox, durable workflows

We'll answer now: **_How do you determine what a running Node system is actually doing?_** and **_How do you safely connect that system to physical devices whose effects cannot always be rolled back?_**. We will build towards:

```txt
Cloud / local control surface
  ↓
Edge agent
  -> request context
  -> structured logs
  -> metrics
  -> diagnostics channels
  -> runtime profiling
  -> local durable queue
  -> command state machine
  ↓
Device adapter
  -> child-process simulator
  -> serial port
  -> USB HID
  -> vendor CLI
  -> Rust native addon
      ↓
    Physical machine
```

We'll continue with Node 24 LTS, strict TypeScript, ESM, and `NodeNext`.

## 1. The Final Systems Mental Model

A production system has two loops.

### The Operational Loop

```txt
input
  ↓
decision
  ↓
state transition
  ↓
side effect
  ↓
confirmation
```

For a web service:

```txt
HTTP request
  ↓
validate
  ↓
database transaction
  ↓
response
```

For hardware:

```txt
command
  ↓
validate
  ↓
send bytes
  ↓
machine acts
  ↓
acknowledgement
```

### The Diagnostic Loop

```txt
system event
  ↓
log / metric / trace
  ↓
symptom detected
  ↓
runtime evidence collected
  ↓
component located
  ↓
source code and deployment identified
  ↓
corrective action
```

You should be able to follow:

```txt
business event
-> trace ID
-> process
-> component
-> source function
-> runtime resource
-> external dependency or device
-> deployment
-> commit
```

That is what observability should produce, not merely 'having logs'.

## 2. Project Layout

We'll continue with creating demonstration code and have data and diagnostics to test it. We'll need to install `serialport` for this part.

Everything before the real serial adapter can run without physical hardware.

## 3. Logs, Metrics, Traces, Profiles, and Dumps are Different Evidence

Do not treat all diagnostic data as interchangeable.

### Logs

A log is a discrete event:

```json
{
  "event": "device_command_finished",
  "comamndId": "abc",
  "durationMs": 82,
  "status": "applied"
}
```

Good for:

- What happened?
- Which command failed?
- What error did the dependency return?

### Metrics

A metric is an aggregated numerical signal:

- device_command_latency_p99 = 420ms
- device_reconnect_total = 17
- event_loop_delay_p99 = 35ms

Good for:

- Is the system unhealthy?
- When did behavior change?
- How widespread is the issue?

### Traces

A trace represents one casually connected operation:

```txt
HTTP request
  -> authorization
  -> database query
  -> local queue insertion
  -> device command
    -> serial write
    -> acknowledgement wait
```

Good for:

- Where did this particular operation spend time?
- Which dependency caused its failure?

### CPU Profile

A CPU profile statistically samples executing stacks:

- Which functions consumed CPU time?
- Why is one process using a core continuously?

### Heap Snapshot

A heap snapshot records the V8 object graph:

- Which objects remain reachable?
- What is retaining them?
- Why is a heap memory growing?

### Diagnostic Report

A diagnostic report captures broad process state:

- JavaScript and native stacks
- V8 heap statistics
- libuv resources
- CPU and memory information
- system limits

Node's diagnostic report API includes these categories and can be invoked programatically with `process.report.writeReport()`. The normal debuggin sequence is:

```txt
metric detects
  ↓
trace localizes
  ↓
logs explain
  ↓
profile or dump proves
```

## 4. Propagates Execution Context with `AsyncLocalStorage`

In synchronous threaded servers, request metadata is often stored in thread-local storage. Node does not keep one request on one OS thread, so that model does not directly work. A request may continue through many Promise callbacks while other requests interleave on the same event loop.

`AsyncLocalStorage` associates state with an asynchronous execution chain. Node describes it as similar to thread-local storage and recommends it over attempting to build custom context propagation directly on low level async hooks.

We build `runWithContext` in [context](../src/observability/51-context.ts) to run an operation that has a scoped execution context. Every asynchronous operation created inside the `run()` callback can retrieve the context like, `const context = currentContext();`.

Prefer `run()` over `enterWith()` for normal request handling. `enterWith()` changes the current synchronous execution context and can unintentionally affect later event handlers; Node specifically recommends `run()` unless there is a strong reason otherwise.

### What `AsyncLocalStorage` Doesn't Do

It does not automantically cross:

- Worker thread boundary
- child-process boundary
- network boundary
- message-broker boundary
- machine restart

You must serialize context into the message:

```ts
worker.postMessage({
  context: currentContext(),
  job,
});
```

Then establish it again in the receiver:

```ts
runWithContext(message.context, () => processJob(message.job));
```

Context propagation is part of your protocol.

### What Belongs in Context vs Function Arguments

Treat `AsyncLocalStorage` as an envelope instead of a letter inside it.

| Belongs in `AsyncLocalStorage` (Ambient Metadata) | Belongs in Function Arguments (Domain Payload) |
| :------------------------------------------------ | :--------------------------------------------- |
| `traceId`, `requestId`, `spanId`                  | `Order`, `Cart`, `Product` objects             |
| `tenantId`, environment`, `region`                | User input or form data                        |
| `userId` or token claims (identities)             | Mutations, updates, and calculation inputs     |
| Active database transaction handle (unit of work) | Business logic return values                   |

## 5. Build a Structured Logger

We build `log` in [logger](../src/observability/52-logger.ts) which logs `debug`, `warn`, `info`, and `error`. It handles the fields which are formatted as key-value, and intakes the `event` and `level`.

Simple usage:

```ts
log("info", "order.persisted", { orderId, durationMs, version });
```

The output would be:

```json
{
  "timestamp": "2026-09-01T05:00:00.000Z",
  "level": "info",
  "event": "order_persisted",
  "pid": 1842,
  "context": {
    "traceId": "c21...",
    "requestId": "a84...",
    "operation": "create_order",
    "component": "order-api"
  },
  "fields": {
    "orderId": "order-123",
    "durationMs": 18.4,
    "version": 3
  }
}
```

A good log record has stable fields:

- timestamp
- level
- event
- service/component
- environment
- deployment version
- trace ID
- request/job/command ID
- business resource ID
- duration
- status
- error type
- dependency

Do not log prose like: '_Something went wrong while handling stuff_'. Prefer a stable event name like, 'device_command_failed', with structured dimensions.

### Cardinality Still Matters in Logs

Logging every byte, SQL row, telemetry sample, or retry attempts can make logging itself a bottlenec.

The logger above is teaching implementation. A serious high-throughput service needs bounded buffering, log-level controls, redaction tests, and explicit behavior when the logging destination is slow.

## 6. Separate Instrumentation from Observation with `diagnostics_channel`

A component should be able to publish diagnostic events without knowing whether the consumer is:

- a logger
- a metrics collector
- a tracing library
- a test harness
- a vendor monitoring SDK

Node's stable `diagnostic_channel` module provides named channels for this purpose. Subscribers execute synchronously when a message is published, so subscribers must remain fast and must not throw.

In [diagnostics](../src/observability/53-diagnostics.ts), the business code publishes:

```ts
publishDeviceDiagnostics({
  phase: "start",
  commandId,
  operation,
});
```

It does not call a specific monitoring vendor. That separation is useful for reusable libraries since it canpublish semantic events and then the application chooses the subscribers. Avoid constructing expensive diagnostic payloads when no subsribers exist:

```ts
if (deviceChannel.hasSubscribers) {
  deviceChannel.publish(buildExpensiveDiagnostic());
}
```
