import math

def recursive_activity_selector(s, f, k, n):
  m = k + 1

  while m <= n and s[m] < f[k]:
    m += 1
  
  if m <= n:
    return [m] + recursive_activity_selector(s, f, m, n)
  else:
    return []

def greedy_activity_selector(s, f, n):
  a = [1]
  k = 1

  for m in range(2, n + 1):
    if s[m] >= f[k]:
      a = a + [m]
      k = m
  
  return a

def dp_activity_selector(s, f, n):
  start = s + [math.inf]
  finish = f + [math.inf]

  total_activities = n + 2

  c = [[0] * total_activities for _ in range(total_activities)]

  for l in range(2, total_activities):
    for i in range(0, total_activities - l):
      j = i + l

      for k in range(i + 1, j):
        if finish[i] <= start[k] and finish[k] <= start[j]:
          q = c[i][k] + c[k][j] + 1
          if q > c[i][j]:
            c[i][j] = q

  # --- PRETTY PRINTING START ---
  print("     " + " ".join(f"{idx:2}" for idx in range(total_activities)))
  print("   " + "-" * (total_activities * 3 + 2))
  for idx, row in enumerate(c):
      row_str = " ".join(f"{val:2}" for val in row)
      print(f"{idx:2} | {row_str}")
    # --- PRETTY PRINTING END ---

  return c[0][total_activities - 1]

s = [0, 1, 3, 0, 5, 3, 5, 6, 8, 8, 2, 12]
f = [0, 4, 5, 6, 7, 9, 9, 10, 11, 12, 14, 16]

chosen_recursive = recursive_activity_selector(s, f, 0, len(s) - 1)
print(chosen_recursive)

chosen_iterative = greedy_activity_selector(s, f, len(s) - 1)
print(chosen_iterative)

chosen_dp = dp_activity_selector(s, f, len(s) - 1)
print(chosen_dp)