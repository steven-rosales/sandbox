import math

def merge(a, p, q, r):
  nL = q - p + 1
  nR = r - q

  l = [0 for _ in range(nL)]
  r = [0 for _ in range(nR)]

  for i in range (0, nL):
    l[i] = a[p + i]
  for j in range(nR):
    r[j] = a[q + j + 1]

  i = 0
  j = 0
  k = p
  while i < nL and j < nR:
    if l[i] <= r[j]:
      a[k] = l[i]
      i += 1
    else:
      a[k] = r[j]
      j += 1
    k += 1

  while i < nL:
    a[k] = l[i]
    i += 1
    k += 1

  while j < nR:
    a[k] = r[j]
    j += 1
    k += 1

def merge_sort(a, p, r):
  if p >= r:
    return
  
  q = math.floor((p + r) / 2)
  
  merge_sort(a, p, q)
  merge_sort(a, q + 1, r)

  merge(a, p, q, r)

  return a

sorted = merge_sort([3, 2, 1], 0, 2)
print(sorted)