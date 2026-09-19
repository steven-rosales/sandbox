import process from "node:process";

process.stdin.setEncoding("utf8");

/**
 * request next chunk
 * -> if buffered: receive it
 * -> otherwise wait
 * -> process chunk
 * -> request next chunk
 * -> ...
 */

for await (const chunk of process.stdin) {
  const text = chunk.toUpperCase();

  if (!process.stdout.write(text)) {
    await new Promise<void>((resolve) => {
      process.stdout.once("drain", resolve);
    });
  }
}
