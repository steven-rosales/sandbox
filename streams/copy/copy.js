import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(new URL("./text-gigantic.txt", import.meta.url));
const fileTextPath = fileURLToPath(new URL("./text.txt", import.meta.url));

(async () => {
  const destFile = await fs.open(
    fileURLToPath(new URL("./dest.txt", import.meta.url)),
    "w",
  );
  const result = await fs.readFile(fileTextPath);

  await destFile.write(result);
})();
