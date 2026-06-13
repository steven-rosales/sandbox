def rectangular_matrix_multiply(A, B):
  p = len(A)
  q = len(A[0])
  r = len(B[0])

  if len(B) != q:
    raise ValueError('Number of cols in A must equal num of rows in B')

  C = [[0 for _ in range(r)] for _ in range(p)]

  for i in range(p):
    for j in range(r):
      for k in range(q):
        C[i][j] = C[i][j] + A[i][k] * B[k][j]

  return C

def matrix_chain_order(p):
  n = len(p) - 1

  m = [[0 for _ in range(n + 1)] for _ in range(n + 1)]
  s = [[0 for _ in range(n + 1)] for _ in range(n + 1)]

  for length in range(2, n + 1):
    for i in range(1, n - length + 2):
      j = i + length - 1
      m[i][j] = float("inf")

      for k in range(i, j):
        cost = (
          m[i][k]
          + m[k + 1][j]
          + p[i - 1] * p[k] * p[j]
        )

        if cost < m[i][j]:
          m[i][j] = cost
          s[i][j] = k

  return m, s


def optimal_parens(s, i, j):
  if i == j:
    return f"A{i}"

  k = s[i][j]
  left = optimal_parens(s, i, k)
  right = optimal_parens(s, k + 1, j)

  return f"({left}{right})"

p = [30, 35, 15, 5, 10, 20, 25]

m, s = matrix_chain_order(p)

print(m[1][len(p) - 1])
print(optimal_parens(s, 1, len(p) - 1))