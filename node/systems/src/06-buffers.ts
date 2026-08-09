import { Buffer } from "node:buffer";

const values = ["a", "e", "😊"];

for (const value of values) {
  console.log({
    value,
    javascriptLength: value.length,
    utf8Bytes: Buffer.byteLength(value, "utf8"),
    bytes: [...Buffer.from(value, "utf8")],
  });
}
