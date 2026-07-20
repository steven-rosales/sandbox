function offlineCacheGreedy(requests, capacity, initialCache = []) {
  const cache = new Set(initialCache);

  if (cache.size > capacity) {
    throw new Error("Initial cache is larger than capacity");
  }

  let misses = 0;

  for (let i = 0; i < requests.length; i += 1) {
    const block = requests[i];

    if (cache.has(block)) {
      continue;
    }

    misses += 1;

    if (capacity === 0) {
      continue;
    }

    if (cache.size === capacity) {
      let blockToEvict = null;
      let farthestNextUse = -1;

      for (const cachedBlock of cache) {
        let nextUse = requests.length;

        for (let j = i + 1; j < requests.length; j += 1) {
          if (requests[j] === cachedBlock) {
            nextUse = j;
            break;
          }
        }

        /*
         * If a block is never requested again, requests.length places it
         * farther away than every valid request index.
         *
         * After each iteration, blockToEvict is the examined cache block
         * whose next use is farthest in the future.
         */
        if (nextUse > farthestNextUse) {
          farthestNextUse = nextUse;
          blockToEvict = cachedBlock;
        }
      }

      cache.delete(blockToEvict);
    }

    cache.add(block);
  }

  return misses;
}

const requests = ["A", "B", "C", "A", "B", "D", "A"];
console.log(offlineCacheGreedy(requests, 2));
