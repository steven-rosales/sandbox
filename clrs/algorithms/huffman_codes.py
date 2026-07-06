import heapq
from dataclasses import dataclass, field

@dataclass(order=True)
class Node:
  freq: int
  order: int=field(compare=True)
  char: str | None = field(default=None, compare=False)
  left: 'Node | None' = field(default=None, compare=False)
  right: 'Node | None' = field(default=None, compare=False)

def huffman(chars: dict[str, int]) -> Node:
  heap: list[Node] = []
  order = 0

  for char, freq in chars.items():
    heapq.heappush(heap, Node(freq=freq, order=order, char=char))
    order += 1

  n = len(heap)

  for _ in range(n - 1):
    x = heapq.heappop(heap)
    y = heapq.heappop(heap)

    z = Node(
      freq = x.freq + y.freq,
      order = order,
      char = None,
      left = x,
      right = y
    )
    order += 1

    heapq.heappush(heap, z)

  return heapq.heappop(heap)

freqs = {
  'a': 45,
  'b': 13,
  'c': 12,
  'd': 16,
  'e': 9,
  'f': 5
}

root = huffman(freqs)

def print_codes(node: Node, prefix: str = '') -> None:
  if node.char is not None:
    print(node.char, prefix)
    return
  
  print_codes(node.left, prefix + '0')
  print_codes(node.right, prefix + '1')

print_codes(root)
