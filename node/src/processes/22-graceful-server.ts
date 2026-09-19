import http from "node:http";
import process from "node:process";

type State = "STARTING" | "RUNNING" | "DRAINING" | "STOPPED";

let state: State = "STARTING";
let activeRequests = 0;

const server = http.createServer(async (_, res) => {
  if (state !== "RUNNING") {
    res.writeHead(503, { Connection: "close" });

    res.end("Server shutting down");
    return;
  }

  activeRequests++;

  try {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 3_000);
    });

    res.writeHead(200);
    res.end("done\n");
  } finally {
    activeRequests--;
  }
});

server.listen(3000, () => {
  state = "RUNNING";

  console.log({
    event: "server_started",
    pid: process.pid,
    port: 3000,
  });
});

let shutdownStarted = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shutdownStarted) return;

  shutdownStarted = true;
  state = "DRAINING";

  console.log({ event: "shutdown_started", signal, activeRequests });

  const forcedShutdown = setTimeout(() => {
    console.error({ event: "shutdown_timeout", activeRequests });

    process.exitCode = 1;

    server.closeAllConnections();
  }, 10_000);

  forcedShutdown.unref();

  server.close((error) => {
    clearTimeout(forcedShutdown);

    if (error !== undefined) {
      console.log(error);
      process.exitCode = 1;
    }

    console.log({ event: "shutdown_complete", activeRequests });
  });
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
