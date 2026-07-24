function quicksort(values, p, r) {
  if (p < r) {
    const q = partition(values, p, r);
    quicksort(values, p, q - 1);
    quicksort(values, q + 1, r);
  }

  return values;
}

function partition(values, p, r) {
  const pivot = values[r];
  let i = p - 1;

  for (let j = p; j < r; j += 1) {
    if (values[j] <= pivot) {
      i += 1;
      [values[i], values[j]] = [values[j], values[i]];
    }
  }

  [values[i + 1], values[r]] = [values[r], values[i + 1]];
  return i + 1;
}

const values = [2, 8, 7, 1, 3, 5, 6, 4];
console.log(quicksort(values, 0, values.length - 1));
