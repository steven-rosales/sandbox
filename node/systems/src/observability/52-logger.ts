import process from "node:process";

import { currentContext } from "./51-context.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

const SECRET_KEY_PATTERN =
  /password|authorization|cookie|token|secret|api[-_]?key/i;

function serializeError(
  error: Error,
  seen: WeakSet<object>,
): Record<string, unknown> {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,

    ...(error.cause === undefined
      ? {}
      : { cause: sanitize(error.cause, seen, 1) }),
  };
}

function sanitize(
  value: unknown,
  seen: WeakSet<object> = new WeakSet<object>(),
  depth = 0,
): unknown {
  if (depth > 8) return "[maximum-depth]";

  if (value === null || value === undefined) return value ?? null;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;

  if (typeof value === "bigint") return value.toString();

  if (typeof value !== "object") return String(value);

  if (seen.has(value)) return "[circular]";

  seen.add(value);

  if (value instanceof Error) return serializeError(value, seen);

  if (value instanceof Date) return value.toISOString();

  if (Buffer.isBuffer(value)) return { type: "Buffer", length: value.length };

  if (Array.isArray(value))
    return value.map((item) => sanitize(item, seen, depth + 1));

  const result: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(value)) {
    result[key] = SECRET_KEY_PATTERN.test(key)
      ? "[redacted]"
      : sanitize(nested, seen, depth + 1);
  }

  return result;
}

export function log(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const context = currentContext();

  const record = {
    timestamp: new Date().toISOString(),

    level,
    event,

    pid: process.pid,

    context: context ?? null,
    fields: sanitize(fields),
  };

  const serialized = `${JSON.stringify(record)}\n`;

  const stream = level === "error" ? process.stderr : process.stdout;

  stream.write(serialized);
}
