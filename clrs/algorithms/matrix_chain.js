function rectangularMatrixMultiply(a, b) {
  const rows = a.length;
  const sharedDimension = a[0].length;
  const columns = b[0].length;

  if (b.length !== sharedDimension) {
    throw new Error("Number of columns in A must equal number of rows in B");
  }

  const product = Array.from({ length: rows }, () => Array(columns).fill(0));

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < columns; j += 1) {
      for (let k = 0; k < sharedDimension; k += 1) {
        product[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return product;
}

function matrixChainOrder(dimensions) {
  const n = dimensions.length - 1;
  const costs = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
  const splits = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));

  for (let length = 2; length <= n; length += 1) {
    for (let i = 1; i <= n - length + 1; i += 1) {
      const j = i + length - 1;
      costs[i][j] = Infinity;

      for (let k = i; k < j; k += 1) {
        const candidate =
          costs[i][k] +
          costs[k + 1][j] +
          dimensions[i - 1] * dimensions[k] * dimensions[j];

        if (candidate < costs[i][j]) {
          costs[i][j] = candidate;
          splits[i][j] = k;
        }
      }
    }
  }

  return { costs, splits };
}

function optimalParens(splits, i, j) {
  if (i === j) {
    return `A${i}`;
  }

  const k = splits[i][j];
  return `(${optimalParens(splits, i, k)}${optimalParens(splits, k + 1, j)})`;
}

const dimensions = [30, 35, 15, 5, 10, 20, 25];
const { costs, splits } = matrixChainOrder(dimensions);

console.log(costs[1][dimensions.length - 1]);
console.log(optimalParens(splits, 1, dimensions.length - 1));
