import http, { ServerResponse, type IncomingMessage } from "node:http";
import { z } from "zod";
import { config } from "./40-config.js";
import { pool } from "./41-database.js";

import { createOrder, IdempotencyConflictError } from "./44-create-order.js";
import { CreateOrderInputSchema } from "./43-domain.js";

class PayloadTooLargeError extends Error {}

function getHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function readJson(
  req: IncomingMessage,
  maximumBytes = 64 * 1024,
): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const rawChunk of req) {
    const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(rawChunk);

    totalBytes += chunk.length;

    if (totalBytes > maximumBytes) throw new PayloadTooLargeError();

    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8");

  return JSON.parse(text);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });

  res.end(JSON.stringify(body));
}

const RequestBodySchema = z.object({
  customerId: z.uuid(),
  amountCents: z.number().int().positive().max(10_000_000),
});

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== "POST" || req.url !== "/orders") {
      sendJson(res, 404, { error: "not_found" });
      return;
    }

    const idempotencyKey = getHeader(req.headers["idempotency-key"]);

    const tenantId = getHeader(req.headers["x-tenant-id"]);

    if (idempotencyKey === undefined || idempotencyKey.length === 0) {
      sendJson(res, 409, { error: "missing_idempotency_key" });
      return;
    }

    if (tenantId === undefined) {
      sendJson(res, 400, { error: "missing_tenant_id" });
      return;
    }

    const body = RequestBodySchema.parse(await readJson(req));

    const input = CreateOrderInputSchema.parse({ tenantId, ...body });

    const result = await createOrder(idempotencyKey, input);

    res.setHeader("x-idempotency-replayed", String(result.replayed));

    sendJson(res, result.httpStatus, result.body);
  } catch (error: unknown) {
    if (error instanceof PayloadTooLargeError) {
      sendJson(res, 413, { error: "payload_too_large" });
      return;
    }

    if (error instanceof IdempotencyConflictError) {
      sendJson(res, 409, { error: "Idempotency_conflict" });
      return;
    }

    if (error instanceof z.ZodError) {
      sendJson(res, 400, { error: "invalid_request", issues: error.issues });
      return;
    }

    console.error({ event: "create_order_failed", error });

    sendJson(res, 500, { error: "internal_error" });
  }
});

server.listen(config.API_PORT, () => {
  console.log({
    event: "api_started",
    port: config.API_PORT,
    pid: process.pid,
  });
});

let shuttingDown = false;

async function shutdown(): Promise<void> {
  if (shuttingDown) return;

  shuttingDown = true;

  server.close(async () => {
    await pool.end();
  });
}

process.once("SIGTERM", () => {
  void shutdown();
});

process.once("SIGINT", () => {
  void shutdown();
});
