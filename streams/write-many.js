import * as fs from "node:fs/promises";
// import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(new URL("text.txt", import.meta.url));

const notFoundFile = (e) => {
  if (e.code === "ENOENT") console.log("File could not be found");
  else console.log(`An error occurred:\n ${e}`);
};

// Execution: 1:03:754 (m:ss:mmm)
// CPU Usage: 100% (one core)
// Memory Usage: 116 MB
/*
(async () => {
  const ONE_MILLION = 1_000_000;
  try {
    const fileHandle = await fs.open(filename, "w");

    console.time("write-many");
    for (let i = 0; i < ONE_MILLION; i++) {
      await fileHandle.write(` ${i.toString()} `);
    }

    console.timeEnd("write-many");
    fileHandle.close();
  } catch (e) {
    notFoundFile(e);
  }
})();
*/

// Execution time: 1.0s
// CPU Usage: 100% (one core)
// Memory usage: 50MB
/*
(async () => {
  const ONE_MILLION = 1_000_000;

  console.time("write-many");
  fs.open(filename, "w", (err, fd) => {
    for (let i = 0; i < ONE_MILLION; i++) fs.writeSync(fd, ` ${i} `);
    console.timeEnd("write-many");
  });
})();
*/

(async () => {
  const ONE_MILLION = 1_000_000;
  try {
    const fileHandle = await fs.open(filename, "w");
    const stream = fileHandle.createWriteStream();

    console.time("write-many");
    for (let i = 0; i < ONE_MILLION; i++) {
      const buff = Buffer.from(` ${i} `, "utf-8");
      stream.write(buff);
    }

    console.timeEnd("write-many");
    fileHandle.close();
  } catch (e) {
    notFoundFile(e);
  }
})();
