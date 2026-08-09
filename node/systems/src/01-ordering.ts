import { readFile } from "node:fs";
import { nextTick } from "node:process";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);

console.log("top-level: start");

Promise.resolve().then(() => {
  console.log("top-level: promise");
});

queueMicrotask(() => {
  console.log("top-level: queueMicrotask");
});

nextTick(() => {
  console.log("top-level: nextTick");
});

setTimeout(() => {
  console.log("top-level: timeout");
}, 0);

setImmediate(() => {
  console.log("top-level: immediate");
});

readFile(currentFile, () => {
  console.log("I/O callback: start");

  Promise.resolve().then(() => {
    console.log("I/O callback: promise");
  });

  queueMicrotask(() => {
    console.log("I/O callback: queueMicrotask");
  });

  nextTick(() => {
    console.log("I/O callback: nextTick");
  });

  setTimeout(() => {
    console.log("I/O callback: timeout");
  }, 0);

  setImmediate(() => {
    console.log("I/O callback: immediate");
  });

  console.log("I/O callback: end");
});

console.log("top-level: end");
