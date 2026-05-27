import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ac = new AbortController();
const { signal } = ac;

const filename = fileURLToPath(new URL("./command.txt", import.meta.url));

setTimeout(() => ac.abort(), 100000);

const notFoundFile = (e) => {
  if (e.code === "ENOENT") console.log("File could not be found");
  else console.log(`An error occurred:\n ${e}`);
};

(async () => {
  try {
    // commands
    const CREATE_FILE = "create a file";
    const DELETE_FILE = "delete the file";
    const RENAME_FILE = "rename the file";
    const ADD_TO_FILE = "add to the file";

    async function createFile(path) {
      try {
        // we want to check whether or not we already have that file
        const existingFileHandle = await fs.open(path, "r");
        existingFileHandle.close();

        return console.log(`The file ${path} already exists...`);
      } catch (e) {
        // we don't have the file, we should create it
        const newFileHandle = await fs.open(path, "w");
        console.log("A new file was successfully created.");
        newFileHandle.close();
      }
    }

    async function deleteFile(path) {
      try {
        await fs.unlink(path);
        console.log(`${path} deleted.`);
      } catch (e) {
        notFoundFile(e);
      }
    }

    async function renameFile(oldPath, newPath) {
      try {
        await fs.rename(oldPath, newPath);
        console.log(`${oldPath} renamed to ${newPath}`);
      } catch (e) {
        notFoundFile(e);
      }
    }

    async function addToFile(path, content) {
      try {
        await fs.appendFile(path, content);
        console.log(`Content: '${content}' added to ${path}`);
      } catch (e) {
        notFoundFile(e);
      }
    }

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

      // delete a file
      // delete the file <path>
      if (command.includes(DELETE_FILE)) {
        const filePath = command.substring(DELETE_FILE.length + 1);
        deleteFile(filePath);
      }

      // rename file:
      // rename the file <path> to <new-path>
      if (command.includes(RENAME_FILE)) {
        const _idx = command.indexOf(" to ");
        const oldFilePath = command.substring(RENAME_FILE.length + 1, _idx);
        const newFilePath = command.substring(_idx + 4);

        renameFile(oldFilePath, newFilePath);
      }

      // add to file:
      // add to the file <path> this content: <content>
      if (command.includes(ADD_TO_FILE)) {
        const _idx = command.indexOf(" with this content: ");
        const filePath = command.substring(ADD_TO_FILE.length + 1, _idx);
        const content = command.substring(_idx + 20);

        addToFile(filePath, content);
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
