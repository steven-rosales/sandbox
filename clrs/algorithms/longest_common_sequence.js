function lcsLength(x, y, m, n) {
  const directions = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(null),
  );
  const lengths = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (x[i - 1] === y[j - 1]) {
        lengths[i][j] = lengths[i - 1][j - 1] + 1;
        directions[i][j] = "diag";
      } else if (lengths[i - 1][j] >= lengths[i][j - 1]) {
        lengths[i][j] = lengths[i - 1][j];
        directions[i][j] = "up";
      } else {
        lengths[i][j] = lengths[i][j - 1];
        directions[i][j] = "left";
      }
    }
  }

  return { lengths, directions };
}

function printLcs(directions, x, i, j) {
  if (i === 0 || j === 0) {
    return;
  }

  if (directions[i][j] === "diag") {
    printLcs(directions, x, i - 1, j - 1);
    console.log(x[i - 1]);
  } else if (directions[i][j] === "up") {
    printLcs(directions, x, i - 1, j);
  } else {
    printLcs(directions, x, i, j - 1);
  }
}

function lcsLengthTwoRows(first, second) {
  let x = first;
  let y = second;

  if (y.length > x.length) {
    [x, y] = [y, x];
  }

  let previous = Array(y.length + 1).fill(0);
  let current = Array(y.length + 1).fill(0);

  for (let i = 1; i <= x.length; i += 1) {
    current[0] = 0;

    for (let j = 1; j <= y.length; j += 1) {
      if (x[i - 1] === y[j - 1]) {
        current[j] = previous[j - 1] + 1;
      } else {
        current[j] = Math.max(previous[j], current[j - 1]);
      }
    }

    [previous, current] = [current, previous];
  }

  return previous[y.length];
}

const x = "ABCBDAB";
const y = "BDCABA";
const { lengths, directions } = lcsLength(x, y, x.length, y.length);

console.log(lengths[x.length][y.length]);
printLcs(directions, x, x.length, y.length);
console.log(lcsLengthTwoRows(x, y));
