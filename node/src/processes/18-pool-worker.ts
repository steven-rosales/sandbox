import { parentPort } from "node:worker_threads";

if (parentPort === null) throw new Error("Worker requires parentPort");

type Job = { id: number; input: number };

type Result = { id: number; output: number };

function fibonacci(n: number): number {
  if (n <= 1) return n;

  return fibonacci(n - 1) + fibonacci(n - 2);
}

parentPort.on("message", (job: Job) => {
  const result: Result = { id: job.id, output: fibonacci(job.input) };

  parentPort?.postMessage(result);
});
