import * as fs from "node:fs/promises";
// import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { finished } from "node:stream/promises";

const filename = fileURLToPath(new URL("text.txt", import.meta.url));

const notFoundFile = (e) => {
  if (e.code === "ENOENT") console.log("File could not be found");
  else console.log(`An error occurred:\n ${e}`);
};

// Execution: 1:03:754 (m:ss:mmm)
// CPU Usage: 100% (one core)
// Memory Usage: 116 MB
/*
(async () => {
  const ONE_MILLION = 1_000_000;
  try {
    const fileHandle = await fs.open(filename, "w");

    console.time("write-many");
    for (let i = 0; i < ONE_MILLION; i++) {
      await fileHandle.write(` ${i.toString()} `);
    }

    console.timeEnd("write-many");
    fileHandle.close();
  } catch (e) {
    notFoundFile(e);
  }
})();
*/

// Execution time: 1.0s
// CPU Usage: 100% (one core)
// Memory usage: 50MB
/*
(async () => {
  const ONE_MILLION = 1_000_000;

  console.time("write-many");
  fs.open(filename, "w", (err, fd) => {
    for (let i = 0; i < ONE_MILLION; i++) fs.writeSync(fd, ` ${i} `);
    console.timeEnd("write-many");
  });
})();
*/

// Execution Time: 339.416ms
// CPU usage 100% (1 core)
// RAM: 112.36 MB
/*
(async () => {
  const ONE_MILLION = 1_000_000;

  const fileHandle = await fs.open(filename, "w");
  const stream = fileHandle.createWriteStream();

  const startCpu = process.cpuUsage();
  const startTime = process.hrtime.bigint();

  console.time("write-many");

  for (let i = 0; i < ONE_MILLION; i++) {
    const ok = stream.write(` ${i} `, "utf-8");

    if (!ok) {
      await new Promise((resolve) => stream.once("drain", resolve));
    }
  }

  stream.end();
  await finished(stream);

  console.timeEnd("write-many");

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

  await fileHandle.close();
})();
*/

(async () => {
  const ONE_MILLION = 1_000_000;

  const fileHandle = await fs.open(filename, "w");
  const stream = fileHandle.createWriteStream();

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

  const fileSize = (await fs.stat(filename)).size;
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
