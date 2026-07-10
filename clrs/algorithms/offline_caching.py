from functools import lru_cache
from math import inf

def offline_cache_dp(requests, capacity, initial_cache=()):
  requests = tuple(requests)
  initial_cache = frozenset(initial_cache)

  if len(initial_cache) > capacity:
    raise ValueError('Initial cache is larger than capacity')

  def next_cache_states(C, block):
    if capacity == 0:
      return [frozenset()]

    if len(C) < capacity:
      return [C | {block}]

    states = []
    for evicted in C:
      C_prime = (C - {evicted}) | {block}
      states.append(frozenset(C_prime))

    return states

  @lru_cache(None)
  def miss(C, i):
    if i == len(requests):
      return 0

    block = requests[i]

    if block in C:
      return miss(C, i + 1)

    best = inf
    for C_prime in next_cache_states(C, block):
      best = min(best, 1 + miss(C_prime, i + 1))

    return best

  return miss(initial_cache, 0)

requests = ["A", "B", "C", "A", "B", "D", "A"]
capacity = 2

print(offline_cache_dp(requests, capacity))