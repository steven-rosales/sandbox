import { spawn } from "node:child_process";
import { once } from "node:events";

const child = spawn(process.execPath, ["dist/processes/12-child.js"], {
  stdio: ["pipe", "pipe", "pipe"],
});

console.log(`parent pid: ${process.pid}`);
console.log(`child pid: ${child.pid}`);

child.stdout.setEncoding("utf8");
child.stderr.setEncoding("utf8");

child.stdout.on("data", (chunk: string) => {
  console.log(`CHILD STDOUT: ${chunk.trim()}`);
});

child.stderr.on("data", (chunk: string) => {
  console.log(`CHILD STDERR: ${chunk.trim()}`);
});

child.stdin.write("hello ");
child.stdin.write("from ");
child.stdin.end("parent \n");

const [code, signal] = await once(child, "exit");

console.log({ code, signal });
