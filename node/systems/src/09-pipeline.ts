import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

async function* generateRecords(count: number): AsyncGenerator<string> {
  for (let id = 0; id < count; id++) {
    yield JSON.stringify({
      id,
      createdAt: new Date().toISOString(),
      payload: `record-${id}`,
    }) + `\n`;
  }

  const controller = new AbortController();

  process.once("SIGINT", () => {
    console.log(`Cancellation requested`);
    controller.abort();
  });

  try {
    await pipeline(
      Readable.from(generateRecords(200_000)),
      createGzip(),
      createWriteStream("records.ndjson.gz"),
      { signal: controller.signal },
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Pipeline cancelled");
    } else {
      throw error;
    }
  }
}
