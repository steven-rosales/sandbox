import { Worker } from "node:worker_threads";

async function run(atomic: boolean): Promise<number> {
  // allocates 4 raw bytes of shared RAM
  const shared = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);

  // creates view/lens over the 4 bytes of `shared`
  const counter = new Int32Array(shared);

  const iterations = 5_000_000;

  const workers = Array.from(
    { length: 4 },
    () =>
      new Worker(new URL("./20-counter-worker.js", import.meta.url), {
        workerData: { shared, iterations, atomic },
      }),
  );

  await Promise.all(
    workers.map(
      (worker) =>
        new Promise<void>((resolve, reject) => {
          worker.once("error", reject);

          worker.once("exit", (code) =>
            code === 0
              ? resolve()
              : reject(new Error(`Worker exited: ${code}`)),
          );
        }),
    ),
  );

  return counter[0]!;
}

console.log({
  expected: 20_000_000,
  unsafe: await run(false),
  atomic: await run(true),
});
