import { describe, it, expect } from "vitest";
import {
  currentContext,
  runWithContext,
  childContext,
  type ExecutionContext,
} from "./51-context.js";

describe("ExecutionContext & AsyncLocalStorage", () => {
  describe("currentContext & runWithContext", () => {
    it("returns undefined outside of an active execution scope", () => {
      expect(currentContext()).toBeUndefined();
    });

    it("exposes context inside a synchronous operation and returns its value", () => {
      const baseContext: ExecutionContext = {
        traceId: "trace-1",
        requestId: "req-1",
        operation: "test.op",
        component: "test-service",
      };

      const result = runWithContext(baseContext, () => {
        expect(currentContext()).toEqual(baseContext);
        return 42;
      });

      expect(result).toBe(42);
      expect(currentContext()).toBeUndefined();
    });

    it("preserves context across asynchronous boundaries", async () => {
      const baseContext: ExecutionContext = {
        traceId: "trace-async",
        requestId: "req-async",
        operation: "async.op",
        component: "worker",
      };

      await runWithContext(baseContext, async () => {
        expect(currentContext()?.requestId).toBe("req-async");
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(currentContext()?.requestId).toBe("req-async");
      });

      expect(currentContext()).toBeUndefined();
    });

    it("maintains separate contexts during concurrent asynchronous tasks", async () => {
      const runTask = (id: string, delay: number) => {
        const ctx: ExecutionContext = {
          traceId: `trace-${id}`,
          requestId: `req-${id}`,
          operation: `op.${id}`,
          component: "concurrent-worker",
        };

        return runWithContext(ctx, async () => {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return currentContext()?.requestId;
        });
      };

      const [res1, res2] = await Promise.all([
        runTask("A", 20),
        runTask("B", 20),
      ]);

      expect(res1).toBe("req-A");
      expect(res2).toBe("req-B");
    });

    it("restores outer context when leaving a nested context", () => {
      const parentCtx: ExecutionContext = {
        traceId: "parent-trace",
        requestId: "parent-req",
        operation: "parent.op",
        component: "api",
      };

      const nestedCtx: ExecutionContext = {
        traceId: "child-trace",
        requestId: "child-req",
        operation: "child.op",
        component: "db",
      };

      runWithContext(parentCtx, () => {
        expect(currentContext()?.requestId).toBe("parent-req");

        runWithContext(nestedCtx, () => {
          expect(currentContext()?.requestId).toBe("child-req");
        });

        expect(currentContext()?.requestId).toBe("parent-req");
      });

      expect(currentContext()).toBeUndefined();
    });
  });

  describe("childContext", () => {
    describe("when no parent context exists", () => {
      it("creates a standalone context with generated IDs and default component fallback", () => {
        const child = childContext({
          operation: "standalone.task",
          commandId: "cmd-1",
        });

        expect(child.traceId).toBeTypeOf("string");
        expect(child.requestId).toBeTypeOf("string");
        expect(child.traceId).not.toBe(child.requestId);
        expect(child.operation).toBe("standalone.task");
        expect(child.commandId).toBe("cmd-1");
        expect(child.component).toBe("unknown");
        expect(child.tenantId).toBeUndefined();
        expect(child.parentRequestID).toBeUndefined();
      });

      it("respects explicit component parameter when provided", () => {
        const child = childContext({
          operation: "standalone.task",
          component: "custom-component",
          commandId: "cmd-2",
        });

        expect(child.component).toBe("custom-component");
      });
    });

    describe("when a parent context is active", () => {
      const parentContext: ExecutionContext = {
        traceId: "parent-trace-123",
        requestId: "parent-req-456",
        operation: "http.request",
        component: "gateway",
        tenantId: "tenant-99",
      };

      it("inherits traceId, tenantId, and parentRequestID while generating a new requestId", () => {
        runWithContext(parentContext, () => {
          const child = childContext({
            operation: "sub.action",
            commandId: "cmd-sub-1",
          });

          expect(child.traceId).toBe(parentContext.traceId);
          expect(child.parentRequestID).toBe(parentContext.requestId);
          expect(child.tenantId).toBe(parentContext.tenantId);
          expect(child.operation).toBe("sub.action");
          expect(child.commandId).toBe("cmd-sub-1");

          // Inherits component when omitted
          expect(child.component).toBe("gateway");

          // Generates a unique requestId distinct from parent
          expect(child.requestId).toBeTypeOf("string");
          expect(child.requestId).not.toBe(parentContext.requestId);
        });
      });

      it("allows overriding component over parent component", () => {
        runWithContext(parentContext, () => {
          const child = childContext({
            operation: "sub.action",
            component: "db-layer",
            commandId: "cmd-sub-2",
          });

          expect(child.component).toBe("db-layer");
        });
      });

      it("does not populate tenantId if parent does not have one", () => {
        const contextWithoutTenant: ExecutionContext = {
          traceId: "trace-no-tenant",
          requestId: "req-no-tenant",
          operation: "background.job",
          component: "queue",
        };

        runWithContext(contextWithoutTenant, () => {
          const child = childContext({
            operation: "process.item",
            commandId: "cmd-job",
          });

          expect(child.tenantId).toBeUndefined();
          expect("tenantId" in child).toBe(false);
        });
      });
    });
  });
});
