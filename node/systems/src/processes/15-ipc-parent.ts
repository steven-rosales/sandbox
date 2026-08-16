import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";

type Request = { type: "sum"; requestId: string; values: number[] };

type Response = { type: "result"; requestId: string; result: number };

const childPath = fileURLToPath(
  new URL("./processes/14-ipc-child.js", import.meta.url),
);

const child = fork(childPath);

const request: Request = {
  type: "sum",
  requestId: crypto.randomUUID(),
  values: [1, 2, 3, 4, 5],
};

child.on("message", (message: Response) => {
  console.log(`Received: ${message}`);

  child.send({ type: "shutdown" });
});

child.send(request);
