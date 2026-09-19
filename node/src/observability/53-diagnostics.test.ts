import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { log } from "./52-logger.js";
import { publishDeviceDiagnostic } from "./53-diagnostics.js";

vi.mock("./52-logger.js", () => ({ log: vi.fn() }));

describe("deviceChannel & publishDeviceDiagnostic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("publishes non-error phases as info logs", () => {
    publishDeviceDiagnostic({
      phase: "start",
      commandId: "cmd-101",
      operation: "reboot",
    });

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("info", "device_command_start", {
      commandId: "cmd-101",
      operation: "reboot",
      durationMs: undefined,
      error: undefined,
    });
  });

  it("publishes error phases as error logs with metadata", () => {
    const error = new Error("Device timed out");

    publishDeviceDiagnostic({
      phase: "error",
      commandId: "cmd-102",
      operation: "firmware-update",
      durationMs: 450,
      error,
    });

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("error", "device_command_error", {
      commandId: "cmd-102",
      operation: "firmware-update",
      durationMs: 450,
      error,
    });
  });

  it("catches subsriber errors and writes to stderr without throwing", () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    vi.mocked(log).mockImplementationOnce(() => {
      throw new Error("Logger write failed");
    });

    expect(() => {
      publishDeviceDiagnostic({
        phase: "finish",
        commandId: "cmd-103",
        operation: "calibrate",
        durationMs: 120,
      });
    }).not.toThrow();

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "diagnostic subscriber failed: Error: Logger write failed",
      ),
    );
  });
});
