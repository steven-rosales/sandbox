import { once } from "node:events";
import { Writable } from "node:stream";

class SlowSink extends Writable {
  public constructor() {
    super({ highWaterMark: 256 * 1024 });
  }

  public override _write(
    _chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    setTimeout(callback, 2);
  }
}

const sink = new SlowSink();

const chunkSize = 64 * 1024;
const numberOfChunks = 1_000;

let backPressureEvents = 0;

for (let i = 0; i < numberOfChunks; i++) {
  const chunk = Buffer.alloc(chunkSize, i % 256);

  const canContinue = sink.write(chunk);

  if (!canContinue) {
    backPressureEvents++;

    console.log({
      event: "backpressure",
      chunk: i,
      writeableLength: sink.writableLength,
    });

    await once(sink, "drain");
  }
}

sink.end();

await once(sink, "finish");

console.log({ bytesWritten: chunkSize * numberOfChunks, backPressureEvents });
