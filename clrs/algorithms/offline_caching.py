def offline_cache_greedy(requests, capacity, initial_cache=()):
  cache = set(initial_cache)

  if len(cache) > capacity:
    raise ValueError('Initial cache is larger than capacity')

  misses = 0

  for i in range(len(requests)):
    block = requests[i]

    # Cache hit
    if block in cache:
      continue
    
    # Cache miss
    misses += 1

    if capacity == 0:
      continue

    # Cache is full: evict the block whose next to use is farthest in the future
    if len(cache) == capacity:
      block_to_evict = None
      farthest_next_use = -1

      for cached_block in cache:
        next_use = len(requests) # Means 'never used again'

        for j in range(i + 1, len(requests)):
          if requests[j] == cached_block:
            next_use = j
            break

        '''
        For each cached block, find its next request after position i. If it is never requested again, use len(requests), which makes it farther away than every valid request index.

        After each iteration, block_to_evict is the cached block examined so far whose next use is farthest in the future.

        Example: requests = ["A", "B", "C", "A"], i = 2, cache = {"A", "B"} A is next used at index 3. B is never used again, so its next-use value is len(requests) = 4. Therefore, B is selected for eviction.
        '''
        if next_use > farthest_next_use:
          farthest_next_use = next_use
          block_to_evict = cached_block

      cache.remove(block_to_evict)

    cache.add(block)
    
  return misses

requests = ["A", "B", "C", "A", "B", "D", "A"]
capacity = 2

print(offline_cache_greedy(requests, capacity))