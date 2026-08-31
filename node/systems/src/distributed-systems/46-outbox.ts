import { inTransaction } from "./42-transaction.js";

export type ClaimedEvent = {
  id: string;
  tenantId: string;
  aggregateId: string;

  eventType: string;
  eventVersion: number;
  payload: unknown;

  attempts: number;

  leaseOwner: string;
  leaseToken: number;
};

type OutboxRow = {
  id: string;
  tenant_id: string;
  aggregate_id: string;

  event_type: string;
  event_version: number;
  payload: unknown;

  attempts: number;

  lease_owner: string;
  lease_token: number;
};

export class LostLeaseError extends Error {
  public constructor(eventId: string) {
    super(`Worker no longer owns event ${eventId}`);
    this.name = "LostLeaseError";
  }
}

/**
 * Claims an event from the table `outbox_events`
 * @param workerId The id of the worker
 * @param limit Limit number of outbox rows to be processed
 * @param leaseMilliseconds Used for setting a bound on time length of lease
 * @returns The outbox rows in an array
 */
export async function claimEvents(
  workerId: string,
  limit: number,
  leaseMilliseconds: number,
): Promise<ClaimedEvent[]> {
  return inTransaction(async (client) => {
    // select and lock (candidates CTE) -> match subset (FROM candidates WHERE event.id = candidates.id) -> update state -> return rows
    const result = await client.query<OutboxRow>(
      `
        WITH candidates AS (
          SELECT id
          FROM app.outbox_events
          WHERE available_at <= now()
            AND (
              status = 'pending'
              OR (
                status = 'processing'
                AND lease_expires_at < now()
              )
            )
          ORDER BY
            available_at, created_at
          FOR UPDATE SKIP LOCKED
          LIMIT $1
        )
        UPDATE app.outbox_events AS event
        SET 
          status = 'processing',
          lease_owner = $2,
          lease_expires_at = clock_timestamp() + ($3::integer * interval '1 millisecond'),
          lease_token = event.lease_token + 1
        FROM candidates
        WHERE event.id = candidates.id
        RETURNING
          event.id, event.tenant_id, event.aggregate_id, event.event_type, event.event_version, event.payload, event.attempts, event.lease_owner, event.lease_token
      `,
      [limit, workerId, leaseMilliseconds],
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      aggregateId: row.aggregate_id,

      eventType: row.event_type,
      eventVersion: row.event_version,
      payload: row.payload,

      attempts: row.attempts,

      leaseOwner: row.lease_owner,
      // fencing token is a monotonically increasing number issued whenever a lock or lease is required
      leaseToken: row.lease_token,
    }));
  });
}

/**
 * Marks the event submitted in app.orders and set to published in app.outbox_events. Using this has a prerequiste of a lease being open on `event.id`
 * @param event The event that was claimed to process
 * @param providerReference The reference of the provider
 */
export async function markPublished(
  event: ClaimedEvent,
  providerReference: string,
): Promise<void> {
  await inTransaction(async (client) => {
    const updateOrder = await client.query(
      `
        UPDATE app.orders
        SET
          status = 'submitted',
          provider_reference = $3,
          version = version + 1,
          updated_at = now()
        WHERE id = $1
          AND tenant_id = $2
          AND status = 'accepted'
        RETURNING id
      `,
      [event.aggregateId, event.tenantId, providerReference],
    );

    if (updateOrder.rowCount !== 1)
      throw new Error("Order could not transition from accepted to submitted");

    const published = await client.query(
      `
        UPDATE app.outbox_events
        SET
          status = 'published',
          published_at = now(),
          lease_owner = NULL,
          lease_expires_at = NULL,
          last_error = NULL
        WHERE id = $1
          AND status = 'processing'
          AND lease_owner = $2
          AND lease_token = $3
        RETURNING id
      `,
      [event.id, event.leaseOwner, event.leaseToken],
    );

    // Throwing rolls back the order update too.
    if (published.rowCount !== 1) throw new LostLeaseError(event.id);
  });
}

function retryDelayMilliseconds(attempt: number): number {
  const base = 250;
  const maximum = 30_000;

  const exponentialCap = Math.min(maximum, base * 2 ** attempt);

  // Full jitter
  return Math.floor(Math.random() * exponentialCap);
}

function errorText(error: unknown): string {
  if (error instanceof Error)
    return `${error.name}: ${error.message}`.slice(0, 2_000);

  return String(error).slice(0, 2_000);
}

/**
 * Marks a app.outbox_event to be either dead or pending, depending on `retryable` and `event.attempts`. It handles failures with exponential backoff.
 * @param event The claimed event
 * @param error An unknown error from an edge
 * @param retryable If the event can be tried again [boolean]
 * @param maximumAttempts Max number of attempts to process event
 */
export async function markFailed(
  event: ClaimedEvent,
  error: unknown,
  retryable: boolean,
  maximumAttempts = 8,
): Promise<void> {
  const nextAttempt = event.attempts + 1;

  const dead = !retryable || nextAttempt >= maximumAttempts;

  const delay = dead ? 0 : retryDelayMilliseconds(nextAttempt);

  const result = await inTransaction(async (client) => {
    return client.query(
      `
        UPDATE app.outbox_events
        SET 
          status = $4,
          attempts = $5,
          available_at = CASE WHEN $4 = 'pending' THEN now() + (
            $6::integer * interval '1 millisecond'
          ) ELSE available_at END,
          lease_owner = NULL,
          lease_expires_at = NULL,
          last_error = $7,
          dead_at = CASE WHEN $4 = 'dead' THEN now() ELSE NULL END
        WHERE id = $1
          AND status = 'processing'
          AND lease_owner = $2
          AND lease_token = $3
        RETURNING id
      `,
      [
        event.id,
        event.leaseOwner,
        event.leaseToken,
        dead ? "dead" : "pending",
        nextAttempt,
        delay,
        errorText(error),
      ],
    );
  });

  if (result.rowCount !== 1) throw new LostLeaseError(event.id);
}
