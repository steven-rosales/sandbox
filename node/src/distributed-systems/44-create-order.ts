import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { inTransaction } from "./42-transaction.js";
import type {
  CreateOrderBody,
  CreateOrderInput,
  OrderCreatedV1,
} from "./43-domain.js";

export class IdempotencyConflictError extends Error {
  public constructor() {
    super("Idempotency Key was already used " + "for a different request");

    this.name = "IdempotencyConflictError";
  }
}

type IdempotencyRow = {
  request_hash: string;
  response_status: number | null;
  response_body: unknown | null;
};

export type CreateOrderResult = {
  httpStatus: number;
  body: CreateOrderBody;
  replayed: boolean;
};

function hashCreateOrderRequest(input: CreateOrderInput): string {
  // fixed field order produces a stable representation; the system will detect the identical hash if a network retry or double-click happens with the same tenantId, customerId, and amountCents
  const canonical = [
    input.tenantId,
    input.customerId,
    input.amountCents.toString(),
  ].join("\0"); // null bytes prevents delimiter safety

  // A determinist many-to-one hash function sha-256 that will take `canonical` as a domain of arbitrary length byte strings ({0, 1}*), respresented as f: {0, 1}* -> {0, 1}^256, which maps the variable input to a fixed 256-bit (32 byte) codomain.
  // Encoding with `digest('hex')` formats the 32 byte raw binary codomain into a human readable, URL- and database-safe 64 character hexadecimal string ([0-9a-f]{64}) where each byte is represented by two hex digits.
  return createHash("sha256").update(canonical).digest("hex");
}

async function findExistingResult(
  client: PoolClient,
  tenantId: string,
  idempotencyKey: string,
  requestHash: string,
): Promise<CreateOrderResult> {
  const existing = await client.query<IdempotencyRow>(
    `
      SELECT
        request_hash,
        response_status,
        response_body
      FROM app.api_idempotency
      WHERE tenant_id = $1
        AND idempotency_key = $2
    `,
    [tenantId, idempotencyKey],
  );

  const row = existing.rows[0];

  if (row === undefined)
    throw new Error("Conflicting idempotency row dissapeared");

  // NOT a genuine retry, payloads are different from hash
  if (row.request_hash !== requestHash) throw new IdempotencyConflictError();

  if (row.response_status === null || row.response_body === null)
    throw new Error("Idempotency record has no completed response");

  return {
    httpStatus: row.response_status,
    body: row.response_body as CreateOrderBody,
    replayed: true,
  };
}

export async function createOrder(
  idempotencyKey: string,
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const requestHash = hashCreateOrderRequest(input);

  return inTransaction(async (client) => {
    // Fails to claim only when idempotency_key and tenant_id match existing
    const claimed = await client.query<{ idempotency_key: string }>(
      `
        INSERT INTO app.api_idempotency (
          tenant_id,
          idempotency_key,
          request_hash
        )
          VALUES ($1, $2, $3)
          ON CONFLICT (
            tenant_id,
            idempotency_key
          )
          DO NOTHING
          RETURNING idempotency_key
      `,
      [input.tenantId, idempotencyKey, requestHash],
    );

    // rowCount being 0 means some key exists, likely idempotency
    if (claimed.rowCount === 0)
      return findExistingResult(
        client,
        input.tenantId,
        idempotencyKey,
        requestHash,
      );

    const orderId = randomUUID();
    const eventId = randomUUID();
    const occurredAt = new Date().toISOString();

    const responseBody: CreateOrderBody = { orderId, status: "accepted" };

    const event: OrderCreatedV1 = {
      eventId,
      eventType: "order.created",
      eventVersion: 1,
      occurredAt,
      tenantId: input.tenantId,
      aggregateId: orderId,
      data: { customerId: input.customerId, amountCents: input.amountCents },
    };

    await client.query(
      `
        INSERT INTO app.orders (
          id,
          tenant_id,
          customer_id,
          amount_cents,
          status
        )
        VALUES ($1, $2, $3, $4, 'accepted')
      `,
      [orderId, input.tenantId, input.customerId, input.amountCents],
    );

    await client.query(
      `
        INSERT INTO app.outbox_events (
          id,
          tenant_id,
          aggregate_type,
          aggregate_id,
          event_type,
          event_version,
          payload
        )
        VALUES ($1, $2, 'order', $3, $4, $5, $6::jsonb)
      `,
      [
        eventId,
        input.tenantId,
        orderId,
        event.eventType,
        event.eventVersion,
        JSON.stringify(event),
      ],
    );

    await client.query(
      `
        UPDATE app.api_idempotency
        SET
          response_status = $3,
          response_body = $4::jsonb
        WHERE tenant_id = $1
          AND idempotency_key = $2      
      `,
      [input.tenantId, idempotencyKey, 200, JSON.stringify(responseBody)],
    );

    return { httpStatus: 202, body: responseBody, replayed: false };
  });
}
