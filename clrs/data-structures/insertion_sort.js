function insertionSort(values) {
  for (let i = 1; i < values.length; i += 1) {
    const key = values[i];
    let j = i - 1;

    while (j >= 0 && values[j] > key) {
      values[j + 1] = values[j];
      j -= 1;
    }

    values[j + 1] = key;
  }

  return values;
}

console.log(insertionSort([2, 1, 5, 4]));
