import { availableParallelism } from "node:os";
import { Worker } from "node:worker_threads";

type Job = { id: number; input: number };

type Result = { id: number; output: number };

type PendingJob =
  | {
      job: Job;
      resolve: (value: number) => void;
      reject: (error: Error) => void;
    }
  | undefined;

type WorkerState = { worker: Worker; busy: boolean; current?: PendingJob };

class WorkerPool {
  readonly #workers: WorkerState[] = [];
  readonly #queue: PendingJob[] = [];

  #nextId = 0;

  public constructor(size: number) {
    // 1) arrival -> bounded resources
    for (let i = 0; i < size; i++) this.#createWorker();
  }

  // 2) queue
  public execute(input: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const pending: PendingJob = {
        job: { id: this.#nextId++, input },
        resolve,
        reject,
      };

      this.#queue.push(pending);
      this.#dispatch();
    });
  }

  public async close() {
    await Promise.all(this.#workers.map(({ worker }) => worker.terminate()));
  }

  // 4) worker
  #createWorker(): void {
    const worker = new Worker(new URL("./18-pool-worker.js", import.meta.url));

    const state: WorkerState = { worker, busy: false };

    worker.on("message", (result: Result) => {
      const current = state.current;

      if (current === undefined) return;

      if (result.id !== current.job.id) {
        current.reject(new Error("Worker returned incorrect job ID"));
      } else {
        current.resolve(result.output);
      }

      state.current = undefined;
      state.busy = false;
    });

    worker.on("error", (error) => {
      state.current?.reject(
        error instanceof Error ? error : new Error("An error occured"),
      );

      state.current = undefined;
      state.busy = false;
    });

    this.#workers.push(state);
  }

  // 3) scheduler
  #dispatch(): void {
    for (const state of this.#workers) {
      if (state.busy) continue;

      const next = this.#queue.shift();

      if (next === undefined) return;

      state.busy = true;
      state.current = next;

      state.worker.postMessage(next.job);
    }
  }
}

const pool = new WorkerPool(Math.max(1, availableParallelism() - 1));

const results = await Promise.all([
  pool.execute(40),
  pool.execute(41),
  pool.execute(42),
  pool.execute(40),
  pool.execute(41),
  pool.execute(42),
]);

console.log(results);

await pool.close();
