import { performance } from "node:perf_hooks";

function blockCpu(milliseconds: number): void {
  const deadline = performance.now() + milliseconds;

  while (performance.now() < deadline) {}
}

console.log("1: beginning");

setTimeout(() => {
  console.log("4: timer callback");
}, 0);

console.log("2: about to block");

blockCpu(1_000);

console.log("3: finished blocking");
