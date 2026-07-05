def quicksort(a, p, r):
  if p < r:
    q = partition(a, p, r)
    quicksort(a, p, q - 1)
    quicksort(a, q + 1, r)

def partition(a, p, r):
  x = a[r]
  i = p - 1

  for j in range(p, r - 1):
    if a[j] <= x:
      i += 1
      a[i] = a[j]
  
  a[i + 1] = a[r]
  return i + 1