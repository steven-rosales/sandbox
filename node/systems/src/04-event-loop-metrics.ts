import { monitorEventLoopDelay, performance } from "node:perf_hooks";

import { setTimeout as sleep } from "node:timers/promises";

function blockCpu(milliseconds: number): void {
  const deadline = performance.now() + milliseconds;

  while (performance.now() < deadline) {}
}

// node schedules a measurement roughly every 10ms
// the histogram has the percentiles, and each percentile represents system response times and latency for the nth percentile poll.
// if the resolution is 10ms, then a recorded 10.4ms, 25ms, and 1003ms would be 0.4ms, 15ms, and 993ms late, respectively
const delayHistogram = monitorEventLoopDelay({ resolution: 10 });

delayHistogram.enable();

let previousUtilization = performance.eventLoopUtilization();

const reporter = setInterval(() => {
  const currentUtilization = performance.eventLoopUtilization();

  const delta = performance.eventLoopUtilization(
    currentUtilization,
    previousUtilization,
  );

  previousUtilization = currentUtilization;

  console.log({
    eventLoopUtilization: delta.utilization.toFixed(3),
    p99DelayMs: (delayHistogram.percentile(99) / 1_000_000).toFixed(2),
    maxDelayMs: (delayHistogram.max / 1_000_000).toFixed(2),
  });

  // delayHistogram.reset();
}, 250);

await sleep(750);

console.log("Blocking JavaScript thread for 1 second...");
blockCpu(1_000);
console.log("JavaScript thread released");

await sleep(750);

clearInterval(reporter);
console.log(delayHistogram.count);
delayHistogram.disable();
