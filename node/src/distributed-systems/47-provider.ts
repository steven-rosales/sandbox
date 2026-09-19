import { createHash, randomUUID } from "node:crypto";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { z } from "zod";

import { config } from "./40-config.js";
import { pool } from "./41-database.js";
import { inTransaction } from "./42-transaction.js";

const ProviderRequestSchema = z.object({
  orderId: z.uuid(),
  tenantId: z.uuid(),

  amountCents: z.number().int().positive(),
});

type ProviderRequest = z.infer<typeof ProviderRequestSchema>;

const ProviderResponseSchema = z.object({
  providerReference: z.string(),
  accepted: z.literal(true),
});

type ProviderResponse = z.infer<typeof ProviderResponseSchema>;

type ProviderRow = { request_hash: string; response_body: unknown };

class ProviderIdempotencyConflictError extends Error {}

function requestHash(req: ProviderRequest): string {
  return createHash("sha256")
    .update([req.tenantId, req.orderId, req.amountCents.toString()].join("\0"))
    .digest("hex");
}
/**
 * Records operation or replays already existing action
 * @param idempotencyKey Key for idempotent action
 * @param req Request stream
 * @returns The response body and a boolean `replayed` flag
 */
async function recordOperation(
  idempotencyKey: string,
  req: ProviderRequest,
): Promise<{ response: ProviderResponse; replayed: boolean }> {
  const hash = requestHash(req);

  return inTransaction(async (client) => {
    const providerReference = `provider-${randomUUID()}`;

    const response: ProviderResponse = {
      providerReference,
      accepted: true,
    };

    const inserted = await client.query(
      `
        INSERT INTO provider.operations (
          idempotency_key,
          request_hash,
          order_id,
          provider_reference,
          response_body
        )
        VALUES ($1, $2, $3, $4, $5::jsonb)
        ON CONFLICT (idempotency_key)
        DO NOTHING
        RETURNING idempotency_key
      `,
      [
        idempotencyKey,
        hash,
        req.orderId,
        providerReference,
        JSON.stringify(response),
      ],
    );

    if (inserted.rowCount === 1) return { response, replayed: false };

    const existing = await client.query<ProviderRow>(
      `
        SELECT request_hash, response_body
        FROM provider.operations
        WHERE idempotency_key = $1
      `,
      [idempotencyKey],
    );

    const row = existing.rows[0];

    if (row === undefined)
      throw new Error("Provider idempotency row dissapeared");

    if (row.request_hash !== hash) throw new ProviderIdempotencyConflictError();

    return {
      response: ProviderResponseSchema.parse(row.response_body),
      replayed: true,
    };
  });
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const failedAfterCommit = new Set<string>();

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== "POST" || req.url !== "/operations") {
      sendJson(res, 404, { error: "not_found" });
      return;
    }

    const idempotencyKey = firstHeader(req.headers["idempotency-key"]);

    if (idempotencyKey === undefined) {
      sendJson(res, 400, { error: "missing_idempotency_key" });
      return;
    }

    const input = ProviderRequestSchema.parse(await readJson(req));

    const result = await recordOperation(idempotencyKey, input);

    const simulateFailure =
      firstHeader(req.headers["x-fail-after-commit"]) === "true";

    /*
      The provider effect is already committed
      Destroy the connection before returning the response

      The caller now sees a network failure even though the operation succeeded
    */

    if (simulateFailure && !failedAfterCommit.has(idempotencyKey)) {
      failedAfterCommit.add(idempotencyKey);

      req.socket.destroy();
      return;
    }

    res.setHeader("x-idempotency-replayed", String(result.replayed));

    sendJson(res, 200, result.response);
  } catch (error: unknown) {
    if (error instanceof ProviderIdempotencyConflictError) {
      sendJson(res, 409, "idempotency_conflict");
      return;
    }

    if (error instanceof z.ZodError) {
      sendJson(res, 400, { error: "invalid_request" });
      return;
    }

    console.error({ event: "provider_operation_failed", error });

    sendJson(res, 400, { error: "provider_error" });
  }
});

server.listen(config.PROVIDER_PORT, () => {
  console.log({
    event: "provider_started",
    posrt: config.PROVIDER_PORT,
    pid: process.pid,
  });
});

async function shutdown(): Promise<void> {
  server.close(async () => await pool.end());
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
