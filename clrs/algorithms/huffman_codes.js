class MinPriorityQueue {
  constructor(compare) {
    this.heap = [];
    this.compare = compare;
  }

  get size() {
    return this.heap.length;
  }

  insert(value) {
    this.heap.push(value);
    this.#bubbleUp(this.heap.length - 1);
  }

  extractMin() {
    if (this.heap.length === 0) {
      throw new Error("extractMin from empty priority queue");
    }

    const min = this.heap[0];
    const last = this.heap.pop();

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.#bubbleDown(0);
    }

    return min;
  }

  #bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[parent], this.heap[index]) <= 0) {
        break;
      }

      [this.heap[parent], this.heap[index]] = [
        this.heap[index],
        this.heap[parent],
      ];
      index = parent;
    }
  }

  #bubbleDown(index) {
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;

      if (
        left < this.heap.length &&
        this.compare(this.heap[left], this.heap[smallest]) < 0
      ) {
        smallest = left;
      }

      if (
        right < this.heap.length &&
        this.compare(this.heap[right], this.heap[smallest]) < 0
      ) {
        smallest = right;
      }

      if (smallest === index) {
        break;
      }

      [this.heap[index], this.heap[smallest]] = [
        this.heap[smallest],
        this.heap[index],
      ];
      index = smallest;
    }
  }
}

class Node {
  constructor(freq, order, char = null, left = null, right = null) {
    this.freq = freq;
    this.order = order;
    this.char = char;
    this.left = left;
    this.right = right;
  }
}

function huffman(chars) {
  const queue = new MinPriorityQueue(
    (a, b) => a.freq - b.freq || a.order - b.order,
  );
  let order = 0;

  for (const [char, freq] of Object.entries(chars)) {
    queue.insert(new Node(freq, order, char));
    order += 1;
  }

  if (queue.size === 0) {
    return null;
  }

  const leafCount = queue.size;
  for (let i = 0; i < leafCount - 1; i += 1) {
    const left = queue.extractMin();
    const right = queue.extractMin();
    const parent = new Node(left.freq + right.freq, order, null, left, right);
    order += 1;
    queue.insert(parent);
  }

  return queue.extractMin();
}

function printCodes(node, prefix = "") {
  if (node === null) {
    return;
  }

  if (node.char !== null) {
    console.log(node.char, prefix);
    return;
  }

  printCodes(node.left, `${prefix}0`);
  printCodes(node.right, `${prefix}1`);
}

const frequencies = {
  a: 45,
  b: 13,
  c: 12,
  d: 16,
  e: 9,
  f: 5,
};

printCodes(huffman(frequencies));
