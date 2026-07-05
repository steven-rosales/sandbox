import { Buffer } from "node:buffer";

const myBuf = Buffer.alloc(3);

myBuf[0] = 0x48;
myBuf[1] = 0x69;
myBuf[2] = 0x21;

const binary = [...myBuf].map((b) => b.toString(2).padStart(8, "0")).join(" ");
const text = myBuf.toString("utf8");

console.log(binary);
console.log(text);
