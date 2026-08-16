import { Worker } from "node:worker_threads";
import { performance } from "node:perf_hooks";

function runWorker(maximum: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./16-cpu-worker.js", import.meta.url), {
      workerData: { maximum },
    });

    worker.once("message", (result: number) => {
      resolve(result);
    });

    worker.once("error", reject);

    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    });
  });
}

const start = performance.now();

const results = await Promise.all([
  runWorker(1_000_000),
  runWorker(1_000_000),
  runWorker(1_000_000),
  runWorker(1_000_000),
]);

console.log({ results, elapsedMs: performance.now() - start });
