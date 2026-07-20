function recursiveActivitySelector(start, finish, k, n) {
  let m = k + 1;

  while (m <= n && start[m] < finish[k]) {
    m += 1;
  }

  if (m <= n) {
    return [m, ...recursiveActivitySelector(start, finish, m, n)];
  }

  return [];
}

function greedyActivitySelector(start, finish, n) {
  const selected = [1];
  let k = 1;

  for (let m = 2; m <= n; m += 1) {
    if (start[m] >= finish[k]) {
      selected.push(m);
      k = m;
    }
  }

  return selected;
}

function dpActivitySelector(startTimes, finishTimes, n) {
  const start = [...startTimes, Infinity];
  const finish = [...finishTimes, Infinity];
  const totalActivities = n + 2;
  const count = Array.from({ length: totalActivities }, () =>
    Array(totalActivities).fill(0),
  );

  for (let length = 2; length < totalActivities; length += 1) {
    for (let i = 0; i < totalActivities - length; i += 1) {
      const j = i + length;

      for (let k = i + 1; k < j; k += 1) {
        if (finish[i] <= start[k] && finish[k] <= start[j]) {
          const candidate = count[i][k] + count[k][j] + 1;
          count[i][j] = Math.max(count[i][j], candidate);
        }
      }
    }
  }

  console.log(
    `     ${count.map((_, index) => String(index).padStart(2)).join(" ")}`,
  );
  console.log(`   ${"-".repeat(totalActivities * 3 + 2)}`);
  count.forEach((row, index) => {
    const values = row.map((value) => String(value).padStart(2)).join(" ");
    console.log(`${String(index).padStart(2)} | ${values}`);
  });

  return count[0][totalActivities - 1];
}

const start = [0, 1, 3, 0, 5, 3, 5, 6, 8, 8, 2, 12];
const finish = [0, 4, 5, 6, 7, 9, 9, 10, 11, 12, 14, 16];

console.log(recursiveActivitySelector(start, finish, 0, start.length - 1));
console.log(greedyActivitySelector(start, finish, start.length - 1));
console.log(dpActivitySelector(start, finish, start.length - 1));
