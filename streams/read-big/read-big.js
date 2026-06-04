import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(
  new URL("../write-many/text.txt", import.meta.url),
);

const notFoundFile = (e) => {
  if (e.code === "ENOENT") console.log("File could not be found");
  else console.log(`An error occurred:\n ${e}`);
};

(async () => {
  const fileHandleRead = await fs.open(filename, "r");

  const stream = fileHandleRead.createReadStream();

  stream.on("data", (chunks) => {
    console.log("-----");
    console.log(chunks);
  });
})();
