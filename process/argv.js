import { argv } from "node:process";

argv.forEach((v, i) => {
  console.log(`${i}: ${v}`);
});
