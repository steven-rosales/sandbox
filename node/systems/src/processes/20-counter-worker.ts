import { workerData } from "node:worker_threads";

type Input = { shared: SharedArrayBuffer; iterations: number; atomic: boolean };

const { shared, iterations, atomic } = workerData as Input;

const counter = new Int32Array(shared);

for (let i = 0; i < iterations; i++) {
  if (atomic) {
    Atomics.add(counter, 0, 1);
  } else {
    counter[0] = counter[0]! + 1;
  }
}
