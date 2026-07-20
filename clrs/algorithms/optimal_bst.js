function optimalBst(successProbabilities, failureProbabilities, n) {
  const expected = Array.from({ length: n + 2 }, () => Array(n + 1).fill(0));
  const weight = Array.from({ length: n + 2 }, () => Array(n + 1).fill(0));
  const root = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= n + 1; i += 1) {
    expected[i][i - 1] = failureProbabilities[i - 1];
    weight[i][i - 1] = failureProbabilities[i - 1];
  }

  for (let length = 1; length <= n; length += 1) {
    for (let i = 1; i <= n - length + 1; i += 1) {
      const j = i + length - 1;
      expected[i][j] = Infinity;
      weight[i][j] =
        weight[i][j - 1] + successProbabilities[j] + failureProbabilities[j];

      for (let r = i; r <= j; r += 1) {
        const candidate =
          expected[i][r - 1] + expected[r + 1][j] + weight[i][j];

        if (candidate < expected[i][j]) {
          expected[i][j] = candidate;
          root[i][j] = r;
        }
      }
    }
  }

  return { expected, root };
}

function constructOptimalBst(root, n) {
  const r = root[1][n];
  console.log(`k${r} is the root`);
  constructSubtree(root, 1, r - 1, r, "left");
  constructSubtree(root, r + 1, n, r, "right");
}

function constructSubtree(root, i, j, parent, side) {
  if (i > j) {
    console.log(`d${j} is the ${side} child of k${parent}`);
    return;
  }

  const r = root[i][j];
  console.log(`k${r} is the ${side} child of k${parent}`);
  constructSubtree(root, i, r - 1, r, "left");
  constructSubtree(root, r + 1, j, r, "right");
}

const { root } = optimalBst(
  [0, 0.15, 0.1, 0.05, 0.1, 0.2],
  [0.05, 0.1, 0.05, 0.05, 0.05, 0.1],
  5,
);

constructOptimalBst(root, 5);
