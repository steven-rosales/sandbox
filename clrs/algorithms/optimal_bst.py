def optimal_bst(p, q, n):
  e = [[0 for j in range(n + 1)] for i in range(n + 2)]
  w = [[0 for j in range(n + 1)] for i in range(n + 2)]
  root = [[0 for j in range(n + 1)] for i in range(n + 1)]

  # e.g., i = 0, ..., 4; j = 0, ..., 4

  # (1, 0) ... (5, 6)
  for i in range(1, n + 2):
    e[i][i - 1] = q[i - 1]
    w[i][i - 1] = q[i - 1]
  
  for l in range(1, n + 1):
    # (1, 1) ... (5, 5)
    # (1, 2) ... (4, 5)
    # (1, 3) ... (3, 5)
    # (1, 4) ... (2, 5)
    # (1, 5)
    for i in range(1, n - l + 2): 
      j = i + l - 1
      e[i][j] = float('inf')
      w[i][j] = w[i][j - 1] + p[j] + q[j]

      for r in range(i, j + 1):
        t = e[i][r - 1] + e[r + 1][j] + w[i][j]
        
        if t < e[i][j]:
          e[i][j] = t
          root[i][j] = r # r ignores the diagonal
  
  return e, root

def construct_optimal_bst(root, n):
  r = root[1][n]
  print(f"k{r} is the root")

  construct_subtree(root, 1, r - 1, r, 'left')
  construct_subtree(root, r + 1, n, r, 'left')

def construct_subtree(root, i, j, parent, side):
  if i > j:
    print(f"d{j} is the {side} child of k{parent}")
    return

  r = root[i][j]
  print(f"k{r} is the {side} child of k{parent}")

  construct_subtree(root, i, r - 1, r, 'left')
  construct_subtree(root, r + 1, j, r, 'right')

e, root = optimal_bst(
    [0, 0.15, 0.10, 0.05, 0.10, 0.20],
    [0.05, 0.10, 0.05, 0.05, 0.05, 0.10],
    5
)

construct_optimal_bst(root, 5)