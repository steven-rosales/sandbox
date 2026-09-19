import type { Frame } from "./32-protocol.js";
import { tryDecodeFrame, encodeFrame } from "./32-protocol.js";

export class FrameParser {
  #buffer = Buffer.alloc(0);

  public push(chunk: Buffer): Frame[] {
    this.#buffer = Buffer.concat([this.#buffer, chunk]);

    const frames: Frame[] = [];

    while (true) {
      const result = tryDecodeFrame(this.#buffer);

      if (result === null) break;

      frames.push(result.frame);

      this.#buffer = result.remaining as Buffer<ArrayBuffer>;
    }

    return frames;
  }
}

// const frameParser = new FrameParser();

// const parsed = frameParser.push(
//   encodeFrame({
//     type: 1,
//     payload: Buffer.from("good morning"),
//   }),
// );

// parsed
//   .map((p) => p.payload.toString("utf8"))
//   .flatMap((p) => {
//     console.log(`1: ${p}\n`);
//   });
