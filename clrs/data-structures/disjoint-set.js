class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }

  find(x) {
    while (x !== this.parent[x]) {
      x = this.parent[x];
    }

    return x;
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);

    if (rootA === rootB) return false;

    this.parent[rootB] = rootA;
    return true;
  }

  connected(a, b) {
    return this.find(a) === this.find(b);
  }
}

const uf = new UnionFind(5);

uf.union(0, 1);
uf.union(1, 2);

console.log(uf.connected(0, 2));
console.log(uf.connected(0, 4));
