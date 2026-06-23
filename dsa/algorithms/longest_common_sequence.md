# Longest Common Sequence

## **_14.4-6_**

Give an $O(n \lg n)$-time algorithm to find the longest monotonically increasing subsequence of a sequence of $n$ numbers.

**_Solution_**

```txt
LMIS-NLGN(A, n)
  let m[1:n] = NIL
  let p[1:n] = NIL

  L = 0

  for i = 1 to n:
    lo = 1
    hi = L
    new_length = 1

    while lo <= hi
      mid = floor((lo + hi) / 2)

      if A[M[mid] <= A[i]]
        new_length = mid + 1
        lo = mid + 1
      else
        hi = mid - 1

    P[i] = NIL
      if new_length > 1
        P[i] = M[new_length - 1]

      M[new_length] = i

      if new_length > L
        L = new_length

    return RECONSTRUCT(A, P, M[L])
```
