import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const filename1 = fileURLToPath(
  new URL("../write-many/text.txt", import.meta.url),
);
const filename2 = fileURLToPath(new URL("./dest.txt", import.meta.url));

const notFoundFile = (e) => {
  if (e.code === "ENOENT") console.log("File could not be found");
  else console.log(`An error occurred:\n ${e}`);
};

(async () => {
  const fileHandleRead = await fs.open(filename1, "r");
  const fileHandleWrite = await fs.open(filename2, "w");

  const streamRead = fileHandleRead.createReadStream();
  const streamWrite = fileHandleWrite.createWriteStream();

  let split = "";

  streamRead.on("data", (chunk) => {
    const numbers = chunk.toString("utf-8").split("  ");

    if (Number(numbers[0]) !== Number(numbers[1] - 1)) {
      if (split) numbers[0] = split.trim() + numbers[0].trim();
    }

    if (
      Number(numbers[numbers.length - 2]) + 1 !==
      Number(numbers[numbers.length - 1])
    ) {
      split = numbers.pop();
    }

    numbers.forEach((n) => {
      if (n % 2 === 0) {
        if (!streamWrite.write(" " + n + " ")) {
          streamRead.pause();
        }
      }
    });
  });

  streamWrite.on("drain", () => {
    streamRead.resume();
  });

  streamRead.on("end", () => {
    console.log("Done Reading.");
  });
})();
