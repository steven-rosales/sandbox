import process from "node:process";
import os from "node:os";

console.log({
  pid: process.pid,
  parentPid: process.ppid,

  platform: process.platform,
  architecture: process.arch,

  cwd: process.cwd(),

  nodeExecutable: process.execPath,

  argv: process.argv,

  uptimeSeconds: process.uptime(),

  availableParallelism: os.availableParallelism(),

  stdinIsTTY: process.stdin.isTTY ?? false,
  stdoutIsTTY: process.stdout.isTTY ?? false,
  stderrIsTTY: process.stderr.isTTY ?? false,
});

console.log(`\nMemory:`);
console.log(process.memoryUsage());

console.log(`\nCPU`);
console.log(process.cpuUsage());

console.log(`\nResources:`);
console.log(process.resourceUsage());
