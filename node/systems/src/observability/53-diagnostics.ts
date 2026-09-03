import { channel } from "node:diagnostics_channel";
import { log } from "./52-logger.js";

export type DeviceDiagnostic = {
  phase: "start" | "finish" | "error";

  commandId: string;
  operation: string;

  durationMs?: number;
  error?: unknown;
};

export const deviceChannel = channel("node-systems.edge-agent.device-command");

export function publishDeviceDiagnostic(diagnostic: DeviceDiagnostic): void {
  if (!deviceChannel.hasSubscribers) return;

  deviceChannel.publish(diagnostic);
}

deviceChannel.subscribe((message: unknown) => {
  /* Subscribers run synchronously in the publisher's execution path. Keep this handler short */
  try {
    const diagnostic = message as DeviceDiagnostic;

    log(
      diagnostic.phase === "error" ? "error" : "info",
      `device_command_${diagnostic.phase}`,
      {
        commandId: diagnostic.commandId,
        operation: diagnostic.operation,
        durationMs: diagnostic.durationMs,
        error: diagnostic.error,
      },
    );
  } catch (error: unknown) {
    /* Never let observability code crash the operation being observed. */
    process.stderr.write(`diagnostic subscriber failed: ${String(error)}\n`);
  }
});
