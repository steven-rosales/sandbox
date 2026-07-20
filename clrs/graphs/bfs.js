class Queue {
  constructor() {
    this.items = [];
    this.head = 0;
  }

  enqueue(value) {
    this.items.push(value);
  }

  dequeue() {
    if (this.isEmpty()) {
      throw new Error("dequeue from empty queue");
    }

    const value = this.items[this.head];
    this.head += 1;
    return value;
  }

  isEmpty() {
    return this.head === this.items.length;
  }
}

function bfs(graph, source) {
  const distance = {};
  const parent = {};

  for (const vertex of Object.keys(graph)) {
    distance[vertex] = Infinity;
    parent[vertex] = null;
  }

  distance[source] = 0;
  const queue = new Queue();
  queue.enqueue(source);

  while (!queue.isEmpty()) {
    const vertex = queue.dequeue();

    for (const neighbor of graph[vertex]) {
      if (distance[neighbor] === Infinity) {
        distance[neighbor] = distance[vertex] + 1;
        parent[neighbor] = vertex;
        queue.enqueue(neighbor);
      }
    }
  }

  return { distance, parent };
}

const graph = {
  s: ["a", "b"],
  a: ["s", "c"],
  b: ["s", "c", "d"],
  c: ["a", "b"],
  d: ["b"],
};

console.log(bfs(graph, "s"));
