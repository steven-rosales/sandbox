def lcs_length(x, y, m, n):
  b = [[0 for _ in range(n + 1)] for _ in range(m + 1)]
  c = [[0 for _ in range(n + 1)] for _ in range(m + 1)]

  for i in range(1, m + 1):
    for j in range(1, n + 1):
      if x[i - 1] == y[j - 1]:
        c[i][j] = c[i - 1][j - 1] + 1
        b[i][j] = 'diag'
      elif c[i - 1][j] >= c[i][j - 1]:
        c[i][j] = c[i - 1][j]
        b[i][j] = 'up'
      else:
        c[i][j] = c[i][j - 1]
        b[i][j] = 'left'
  
  return c, b

def print_lcs(b, x, i, j):
  if i == 0 or j == 0:
    return

  if b[i][j] == 'diag':
    print_lcs(b, x, i - 1, j - 1)
    print(x[i - 1])
  elif b[i][j] == 'up':
    print_lcs(b, x, i - 1, j)
  else:
    print_lcs(b, x, i, j - 1)

x = "ABCBDAB"
y = "BDCABA"

c, b = lcs_length(x, y, len(x), len(y))
print(c[len(x)][len(y)])
print_lcs(b, x, len(x), len(y))

def lcs_length_two_rows(x, y):
  if len(y) > len(x):
    x, y = y, x

  m = len(x)
  n = len(y)

  prev = [0] * (n + 1)
  curr = [0] * (n + 1)

  for i in range(1, m + 1):
    curr[0] = 0

    for j in range(1, n + 1):
      if x[i - 1] == y[j - 1]:
        curr[j] = prev[j - 1] + 1
      else:
        curr[j] = max(prev[j], curr[j - 1])
    
    prev, curr = curr, prev

  return prev[n]