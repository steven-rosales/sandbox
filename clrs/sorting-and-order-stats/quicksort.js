function quicksort(a, p, r) {
  if (p < r) {
    const q = partition(a, p, r);
    quicksort(a, p, q - 1);
    quicksort(a, q + 1, r);
  }

  return a;
}

function partition(a, p, r) {
  const pivot = a[r];
  let i = p - 1;

  for (let j = p; j < r; j++) {
    if (a[j] <= pivot) {
      i++;
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  [a[i + 1], a[r]] = [a[r], a[i + 1]];
  return i + 1;
}

const a = [2, 8, 7, 1, 3, 5, 6, 4];
console.log(quicksort(a, 0, a.length - 1));
