import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const filename = fileURLToPath(new URL("./text-gigantic.txt", import.meta.url));
const fileTextPath = fileURLToPath(new URL("./text-copy.txt", import.meta.url));

/*
(async () => {
  const destFile = await fs.open(
    fileURLToPath(new URL("./dest.txt", import.meta.url)),
    "w",
  );
  const result = await fs.readFile(fileTextPath);

  await destFile.write(result);
})();
*/

/*
(async () => {
  console.time("copy");

  const srcFile = await fs.open(filename, "r");
  const destFile = await fs.open(fileTextPath, "w");

  let bytesRead = -1;

  while (bytesRead !== 0) {
    const readResult = await srcFile.read();
    bytesRead = readResult.bytesRead;

    if (bytesRead !== 16384) {
      const indexOfNotFilled = readResult.buffer.indexOf(0);
      const newBuffer = Buffer.alloc(indexOfNotFilled);
      readResult.buffer.copy(newBuffer, 0, 0, indexOfNotFilled);
      destFile.write(newBuffer);
    } else {
      destFile.write(readResult.buffer);
    }

    if (bytesRead > 0) {
      await destFile.write(readResult.buffer.subarray(0, bytesRead));
    }
  }

  console.timeEnd("copy");
})();
*/

(async () => {
  console.time("copy");

  const srcFile = await fs.open(filename, "r");
  const destFile = await fs.open(fileTextPath, "w");

  const readStream = srcFile.createReadStream();
  const writeStream = destFile.createWriteStream();

  pipeline(readStream, writeStream, (err) => {
    console.log(err);
    console.timeEnd("copy");
  });
})();
