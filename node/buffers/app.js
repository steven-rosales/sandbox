import { Buffer } from "node:buffer";

/*
// 4 bytes (32 bits)
const memoryContainer = Buffer.alloc(4);

memoryContainer[0] = 0xf4;
memoryContainer[1] = 0x34;
memoryContainer.writeInt8(-34, 2);
memoryContainer[3] = 0xff;

// Printed in hex
console.log(memoryContainer);
// Printed in decimal
console.log(memoryContainer[0]);
console.log(memoryContainer.readInt8(2));
console.log(memoryContainer[2]);
console.log(memoryContainer[3]);
*/

/*
const buff = Buffer.from([0x48, 0x69, 0x21]);
console.log(buff.toString("utf-8"));
*/

/*
const buff = Buffer.from("486921", "hex");
console.log(buff.toString("utf-8"));
*/

const buff = Buffer.from("string", "utf-8");
console.log(buff);
console.log(buff.toString("utf-8"));
