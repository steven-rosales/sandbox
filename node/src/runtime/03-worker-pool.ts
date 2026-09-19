import { pbkdf2 } from "node:crypto";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const startedAt = performance.now();

function elapsed(): string {
  return `${(performance.now() - startedAt).toFixed(0)} ms`;
}

function deriveKey(id: number): Promise<void> {
  console.log(`${elapsed()} queued PBKDF2 ${id}`);

  return new Promise<void>((resolve, reject) => {
    pbkdf2("password", `salt-${id}`, 400_000, 32, "sha512", (error) => {
      if (error !== null) {
        reject(error);
        return;
      }

      console.log(`${elapsed()} completed PKBDF2 ${id}`);
      resolve();
    });
  });
}

async function readCurrentFile(): Promise<void> {
  console.log(`${elapsed()} queued readFile`);

  await readFile(currentFile);

  console.log(`${elapsed()} completed readFile`);
}

const heartbeat = setInterval(() => {
  console.log(`${elapsed()} event loop heartbeat`);
}, 100);

const cryptoTasks = Array.from({ length: 8 }, (_, index) => deriveKey(index));

// This is deliberately queued after the expensive crypto operations.
const fileTask = readCurrentFile();
await Promise.all([...cryptoTasks, fileTask]);
clearInterval(heartbeat);
