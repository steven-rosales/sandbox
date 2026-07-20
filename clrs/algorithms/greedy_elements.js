class Item {
  constructor(value, weight) {
    this.value = value;
    this.weight = weight;
  }
}

function fractionalKnapsack(capacity, items) {
  items.sort((a, b) => b.value / b.weight - a.value / a.weight);
  let totalValue = 0;

  for (const item of items) {
    if (capacity >= item.weight) {
      capacity -= item.weight;
      totalValue += item.value;
    } else {
      const fraction = capacity / item.weight;
      totalValue += item.value * fraction;
      break;
    }
  }

  return totalValue;
}

function knapsack01(values, weights, n, maxCapacity) {
  const best = Array.from({ length: n + 1 }, () =>
    Array(maxCapacity + 1).fill(0),
  );

  for (let i = 1; i <= n; i += 1) {
    for (let capacity = 1; capacity <= maxCapacity; capacity += 1) {
      if (weights[i - 1] <= capacity) {
        best[i][capacity] = Math.max(
          values[i - 1] + best[i - 1][capacity - weights[i - 1]],
          best[i - 1][capacity],
        );
      } else {
        best[i][capacity] = best[i - 1][capacity];
      }
    }
  }

  return best[n][maxCapacity];
}

const maxCapacity = 50;
const items = [new Item(60, 10), new Item(100, 20), new Item(120, 30)];
const values = items.map((item) => item.value);
const weights = items.map((item) => item.weight);

const fractionalMax = fractionalKnapsack(maxCapacity, items);
const zeroOneMax = knapsack01(values, weights, items.length, maxCapacity);

console.log(
  `Maximum value in fractional Knapsack: ${fractionalMax.toFixed(2)}`,
);
console.log(`Maximum value in 0/1 Knapsack: ${zeroOneMax}`);
