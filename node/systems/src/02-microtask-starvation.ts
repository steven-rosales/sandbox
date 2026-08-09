import { performance } from "node:perf_hooks";

const startedAt = performance.now();

setTimeout(() => {
  const delay = performance.now() - startedAt;

  console.log(`Timer finally executed after ${delay.toFixed(2)} ms`);
}, 0);

let count = 0;
const maximum = 500_000;

function scheduleAnotherMicrotask(): void {
  queueMicrotask(() => {
    count++;

    if (count < maximum) {
      scheduleAnotherMicrotask();
      return;
    }

    console.log(`Completed ${count} microtasks`);
  });
}

scheduleAnotherMicrotask();
