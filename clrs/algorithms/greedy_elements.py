class Item:
  def __init__(self, value, weight):
    self.value = value
    self.weight = weight

def fractional_knapsack(capacity, items):
  items.sort(key=lambda x: x.value / x.weight, reverse = True)

  total_value = 0.0

  for item in items:
    if capacity >= item.weight:
      capacity -= item.weight
      total_value += item.value
    else:
      fraction = capacity / item.weight
      total_value += item.value * fraction
      break
  
  return total_value

def knapsack_0_1(v, w, n, W):
  c = [[0] * (W + 1) for _ in range(n + 1)]

  for i in range(1, n + 1):
    for capacity in range(1, W + 1):
      if w[i - 1] <= capacity:
        c[i][capacity] = max(
          v[i - 1] + c[i - 1][capacity - w[i - 1]], 
          c[i - 1][capacity]
        )
      else:
        c[i][capacity] = c[i - 1][capacity]

  return c[n][W]

if __name__ == '__main__':
  max_capacity = 50

  items_list = [Item(60, 10), Item(100, 20), Item(120, 30)]
  values = [item.value for item in items_list]
  weights = [item.weight for item in items_list]

  max_val = fractional_knapsack(max_capacity, items_list)
  max_0_1_val = knapsack_0_1(values, weights, len(items_list), max_capacity)

  print(f"Maximum value in fractional Knapsack: {max_val:.2f}")
  print(f"Maximum value in 0/1 Knapsack: {max_0_1_val}")
