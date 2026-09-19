function heapsort(a) {
  let n = a.length;

  buildMaxHeap(a, n);

  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];

    // reduces each max heapify, giving nice intuition of swapping the largest at every cut down array iteration
    n--;
    maxHeapify(a, 0, n);
  }

  console.log(a);
}

function buildMaxHeap(a, n) {
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    maxHeapify(a, i, n);
  }
}

function maxHeapify(a, i, n) {
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  let largest = i;

  if (left < n && a[left] > a[largest]) largest = left;

  if (right < n && a[right] > a[largest]) largest = right;

  if (largest !== i) {
    [a[i], a[largest]] = [a[largest], a[i]];
    maxHeapify(a, largest, n);
  }
}

heapsort([4, 2, 1, 5]);
