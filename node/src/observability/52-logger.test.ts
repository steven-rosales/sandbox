import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { log, type LogLevel } from "./52-logger.js";
import * as contextModule from "./51-context.js";

let stdoutSpy: ReturnType<typeof vi.spyOn>;
let stderrSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  stdoutSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
  stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function getLastLog(spy: typeof stdoutSpy) {
  const raw = spy.mock.calls[0]?.[0];
  return raw ? JSON.parse(raw.toString()) : null;
}

describe("stream routing", () => {
  it("writes info, warn, and debug to stdout", () => {
    log("info", "app.start");
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    expect(stderrSpy).not.toHaveBeenCalled();

    const output = getLastLog(stdoutSpy);
    expect(output.level).toBe("info");
    expect(output.event).toBe("app.start");
  });

  it("writes error to stderr", () => {
    log("error", "db.failed");
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    expect(stdoutSpy).not.toHaveBeenCalled();

    const output = getLastLog(stderrSpy);
    expect(output.level).toBe("error");
  });
});

describe("context resolution", () => {
  it("attaches execution context when present", () => {
    vi.spyOn(contextModule, "currentContext").mockReturnValue({
      traceId: "tr-123",
      requestId: "req-456",
      operation: "http.req",
      component: "api",
    });

    log("info", "test-event");
    const output = getLastLog(stdoutSpy);

    expect(output.context).toEqual({
      traceId: "tr-123",
      requestId: "req-456",
      operation: "http.req",
      component: "api",
    });
  });

  it("falls back to null context when absent", () => {
    vi.spyOn(contextModule, "currentContext").mockReturnValue(undefined);

    log("info", "test.event");
    const output = getLastLog(stdoutSpy);

    expect(output.context).toBeNull();
  });
});

describe("sanitazion & serialization", () => {
  it("redacts sensitive keys matching pattern", () => {
    log("info", "user.login", {
      user: "steve",
      password: "raw_password",
      authToken: "bearer-xyz",
      apiKey: "sk-12345",
    });

    const output = getLastLog(stdoutSpy);
    expect(output.fields).toEqual({
      user: "steve",
      password: "[redacted]",
      authToken: "[redacted]",
      apiKey: "[redacted]",
    });
  });

  it("handles circular references safely", () => {
    const parent: Record<string, unknown> = { name: "parent" };
    parent.self = parent;

    log("info", "cycle.test", parent);

    const output = getLastLog(stdoutSpy);

    expect(output.fields.self).toBe("[circular]");
  });

  it("enforces max recursion depth", () => {
    let nested: Record<string, unknown> = { depth: 10 };
    for (let i = 0; i < 10; i++) {
      nested = { child: nested };
    }

    log("info", "depth.test", nested);

    const output = getLastLog(stdoutSpy);
    let curr = output.fields;

    while (curr.child && typeof curr.child === "object") {
      curr = curr.child;
    }

    expect(curr.child).toBe("[maximum-depth]");
  });

  it("serializes special types (Date, Buffer, BigInt, Error with cause)", () => {
    const now = new Date("2026-09-02T12:00:00.000Z");
    const err = new Error("failed", { cause: new Error("root-cause") });

    log("warn", "types.test", {
      timestamp: now,
      buffer: Buffer.from("hello"),
      count: 9007199254740991n,
      error: err,
    });

    const output = getLastLog(stdoutSpy);

    expect(output.fields.timestamp).toBe("2026-09-02T12:00:00.000Z");
    expect(output.fields.buffer).toEqual({ type: "Buffer", length: 5 });
    expect(output.fields.count).toBe("9007199254740991");
    expect(output.fields.error.message).toBe("failed");
    expect(output.fields.error.cause.message).toBe("root-cause");
  });
});
