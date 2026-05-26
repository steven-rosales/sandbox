def rectangular_matrix_multiply(A, B):
  """
    Multiply rectangular matrices A and B.

    A is p x q
    B is q x r
    returns C as p x r
  """
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

A = [
    [1, 2, 3],
    [4, 5, 6]
]

B = [
    [7, 8],
    [9, 10],
    [11, 12]
]

C = rectangular_matrix_multiply(A, B)

print(C)