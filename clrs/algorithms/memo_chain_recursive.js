function memoizedMatrixChain(dimensions, n) {
  const costs = Array.from({ length: n + 1 }, () =>
    Array(n + 1).fill(Infinity),
  );
  lookupChain(costs, dimensions, 1, n);
  return costs;
}

function lookupChain(costs, dimensions, i, j) {
  if (costs[i][j] < Infinity) {
    return costs[i][j];
  }

  if (i === j) {
    costs[i][j] = 0;
  } else {
    for (let k = i; k < j; k += 1) {
      const candidate =
        lookupChain(costs, dimensions, i, k) +
        lookupChain(costs, dimensions, k + 1, j) +
        dimensions[i - 1] * dimensions[k] * dimensions[j];

      costs[i][j] = Math.min(costs[i][j], candidate);
    }
  }

  return costs[i][j];
}

const dimensions = [30, 35, 15, 5, 10, 20, 25];
const costs = memoizedMatrixChain(dimensions, dimensions.length - 1);

console.log(costs[1][dimensions.length - 1]);
