import { spawn } from "node:child_process";

let failures = 0;
let shuttingDown = false;

// exponential backoff
function delayForFailureCount(failureCount: number): number {
  const base = 250;
  const maximum = 10_000;

  return Math.min(maximum, base * 2 ** failureCount);
}

function startChild(): void {
  if (shuttingDown) return;

  const child = spawn(
    process.execPath,
    ["dist/processes/23-unstable-child.js"],
    { stdio: "inherit" },
  );

  console.log({ event: "spawned", pid: child.pid });

  child.once("exit", (code, signal) => {
    console.log({ event: "child_exit", code, signal });

    if (shuttingDown) return;

    code === 0 ? (failures = 0) : failures++;

    const delay = delayForFailureCount(failures);

    console.log({ event: "restart_scheduled", delay });

    setTimeout(startChild, delay);
  });

  const stop = (): void => {
    if (shuttingDown) return;

    shuttingDown = true;

    console.log({ event: "supervisor_shutdown" });

    child.kill("SIGTERM");
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

startChild();
