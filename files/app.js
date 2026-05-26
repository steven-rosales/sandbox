import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ac = new AbortController();
const { signal } = ac;

const filename = fileURLToPath(new URL("./command.txt", import.meta.url));

setTimeout(() => ac.abort(), 100000);

(async () => {
  try {
    async function createFile(path) {
      try {
        // we want to check whether or not we already have that file
        const existingFileHandle = await fs.open(path, "r");
        existingFileHandle.close();

        return console.log(`The file ${path} already exists...`);
      } catch (error) {
        // we don't have the file, we should create it
        const newFileHandle = await fs.open(path, "w");
        console.log("A new file was successfully created.");
        newFileHandle.close();
      }
    }

    // commands
    const CREATE_FILE = "create a file";

    const commandFileHandler = await fs.open(filename, "r");

    commandFileHandler.on("change", async () => {
      // get size of our file
      const size = (await commandFileHandler.stat()).size;

      // allocate our buffer with file size
      const buff = Buffer.alloc(size);

      // the location at which we want to start filling our buffer
      const offset = 0;
      // how many bytes we want to read
      const length = buff.byteLength;
      // position that we want to start reading the file from
      const position = 0;

      // we always wnat to read the whole content (from the beginning to the end)
      await commandFileHandler.read(buff, offset, length, position);

      const command = buff.toString("utf-8");

      // create a file:
      // create a file <path>
      if (command.includes(CREATE_FILE)) {
        const filePath = command.substring(CREATE_FILE.length + 1);
        createFile(filePath);
      }
    });

    // watcher
    const watcher = fs.watch(filename, { signal });

    for await (const event of watcher) {
      if (event.eventType === "change" && event.filename === "command.txt") {
        commandFileHandler.emit("change");
      }
    }
  } catch (err) {
    if (err.name === "AbortError") return;
    throw err;
  }
})();
