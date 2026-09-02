import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export type ExecutionContext = {
  traceId: string;
  requestId: string;

  operation: string;
  component: string;

  tenantId?: string;
  commandId?: string;

  parentRequestID?: string;
};

export const contextStorage = new AsyncLocalStorage<ExecutionContext>({
  name: "execution-context",
});

export function runWithContext<T>(
  context: ExecutionContext,
  operation: () => T,
): T {
  return contextStorage.run(context, operation);
}

export function currentContext(): ExecutionContext | undefined {
  return contextStorage.getStore();
}

export function childContext(input: {
  operation: string;
  component?: string;
  commandId: string;
}): ExecutionContext {
  const parent = currentContext();

  return {
    traceId: parent?.traceId ?? randomUUID(),
    requestId: randomUUID(),
    operation: input.operation,
    component: input.component ?? parent?.component ?? "unknown",
    ...(parent?.tenantId === undefined ? {} : { tenantId: parent.tenantId }),
    ...(input.commandId === undefined ? {} : { commandId: input.commandId }),
    ...(parent === undefined ? {} : { parentRequestID: parent.requestId }),
  };
}
