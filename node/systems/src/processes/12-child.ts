import process from "node:process";

console.error(`child started: pid=${process.pid}`);

let bytes = 0;

for await (const chunk of process.stdin) {
  const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;

  bytes += buffer.length;

  process.stdout.write(buffer);
}

console.error(`child received ${bytes} bytes`);
