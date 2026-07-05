import { Writable } from "node:stream";
import fs from "node:fs";
import * as fsPromises from "node:fs/promises";
import { finished } from "node:stream/promises";

class FileWriteStream extends Writable {
  constructor({ highWaterMark, fileName }) {
    super({ highWaterMark });

    this.fileName = fileName;
    this.fd = null;
    this.chunks = [];
    this.chunksSize = 0;
    this.writesCount = 0;
  }

  // This will run after the constructor and will put off all the other methods until we call the callback function
  _construct(callback) {
    fs.open(this.fileName, "w", (err, fd) => {
      // if we call the callback with an argument, it means that we have an error and we should not proceed
      if (err) {
        callback(err);
      } else {
        this.fd = fd;
        // no argument means it was successful
        callback();
      }
    });
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(chunk);
    this.chunksSize += chunk.length;

    if (this.chunksSize > this.writableHighWaterMark) {
      fs.write(this.fd, Buffer.concat(this.chunks), (err) => {
        if (err) return callback(err);

        this.chunks = [];
        this.chunksSize = 0;
        ++this.writesCount;
        callback();
      });
    } else {
      // when we're done, call the callback function
      callback();
    }
  }

  _final(callback) {
    fs.write(this.fd, Buffer.concat(this.chunks), (err) => {
      if (err) callback(err);

      this.chunks = [];
      callback();
    });
  }

  _destroy(error, callback) {
    console.log("Number of writes:", this.writesCount);

    if (this.fd) {
      fs.close(this.fd, (err) => {
        callback(err || error);
      });
    } else {
      callback(error);
    }
  }
}

// const stream = new FileWriteStream({
//   highWaterMark: 1000,
//   fileName: "./streams/custom-writeable/text.txt",
// });

(async () => {
  const filename = "./streams/custom-writeable/text.txt";

  const ONE_MILLION = 1_000_000;

  const stream = new FileWriteStream({
    fileName: filename,
  });

  const startCpu = process.cpuUsage();
  const startTime = process.hrtime.bigint();

  console.time("write-many");

  const DEFAULT_KIB_BUFFER_HIGHWATERMARK = 65536;
  let drainCount = 0;

  // const buff = Buffer.alloc(65536, "a");
  // console.log(stream.write(buff));
  for (let i = 0; i < ONE_MILLION; i++) {
    const ok = stream.write(` ${i} `, "utf-8");

    if (!ok) {
      drainCount++;
      await new Promise((resolve) => stream.once("drain", resolve));
    }
  }

  stream.end();
  await finished(stream);

  const fileSize = (await fsPromises.stat(filename)).size;
  const highWaterMark = stream.writableHighWaterMark;

  console.log(`Counted number of drains: ${drainCount}`);

  console.log(`File size: ${fileSize} bytes`);
  console.log(`High water mark: ${highWaterMark} bytes`);
  console.log(
    `Approx highWaterMark-sized chunks: ${Math.ceil(fileSize / highWaterMark)}`,
  );

  console.timeEnd("write-many");

  // Performance

  const endTime = process.hrtime.bigint();
  const cpu = process.cpuUsage(startCpu);
  const mem = process.memoryUsage();
  const resource = process.resourceUsage();

  const wallMs = Number(endTime - startTime) / 1_000_000;
  const cpuMs = (cpu.user + cpu.system) / 1000;
  const oneCoreCpuPercent = (cpuMs / wallMs) * 100;

  console.log({
    wallMs: wallMs.toFixed(2),
    cpuMs: cpuMs.toFixed(2),
    oneCoreCpuPercent: oneCoreCpuPercent.toFixed(2) + "%",
    rssMB: (mem.rss / 1024 / 1024).toFixed(2),
    heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
    maxRssMB: (resource.maxRSS / 1024).toFixed(2),
  });
})();
