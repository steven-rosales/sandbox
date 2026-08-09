import { memoryUsage } from "node:process";
import { getHeapSnapshot, getHeapStatistics } from "node:v8";

function megabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function snapshot(label: string): void {
  const processMemory = memoryUsage();
  const heap = getHeapStatistics();

  console.log(`\n--- ${label} ---`);

  console.table({
    rss: megabytes(processMemory.rss),
    heapTotal: megabytes(processMemory.heapTotal),
    heapUsed: megabytes(processMemory.heapUsed),
    external: megabytes(processMemory.external),
    arrayBuffers: megabytes(processMemory.arrayBuffers),
    heapLimit: megabytes(heap.heap_size_limit),
  });
}

snapshot("initial");

let objects: Array<{ id: number; name: string; metadata: number[] }> | null =
  Array.from({ length: 400_000 }, (_, id) => ({
    id,
    name: `object-${id}`,
    metadata: [id, id + 1, id + 2],
  }));

snapshot("after JavaScript objects");

let buffers: Buffer[] | null = Array.from({ length: 64 }, () =>
  Buffer.alloc(1024 * 1024, 1),
);

snapshot("after 64 MB of buffers");

// Remove our references
objects = null;
buffers = null;

const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc;

if (gc !== undefined) {
  gc();
  snapshot("after explicit GC");
} else {
  console.log(`\nRun with --expose-gc to request an explicit collection.`);
}
