import { Buffer } from "node:buffer";

const b = Buffer.alloc(0.5e9);

setInterval(() => {
  // for (let i = 0; i < b.length; i++) {
  //   b[i] = 0x44;
  // }

  b.fill(0x22);
}, 5000);

setInterval(() => {
  console.log(process.memoryUsage());
}, 1000);
