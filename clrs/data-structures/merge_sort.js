function merge(values, p, q, r) {
  const left = values.slice(p, q + 1);
  const right = values.slice(q + 1, r + 1);
  let i = 0;
  let j = 0;
  let k = p;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      values[k] = left[i];
      i += 1;
    } else {
      values[k] = right[j];
      j += 1;
    }
    k += 1;
  }

  while (i < left.length) {
    values[k] = left[i];
    i += 1;
    k += 1;
  }

  while (j < right.length) {
    values[k] = right[j];
    j += 1;
    k += 1;
  }
}

function mergeSort(values, p, r) {
  if (p >= r) {
    return values;
  }

  const q = Math.floor((p + r) / 2);
  mergeSort(values, p, q);
  mergeSort(values, q + 1, r);
  merge(values, p, q, r);
  return values;
}

console.log(mergeSort([3, 2, 1], 0, 2));
