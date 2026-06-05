#include <stdio.h>

int is_even(int x) {
  return x % 2 == 0;
}

int sum_to(int n) {
  int total = 0;

  for (int i = 1; i <= n; i++) {
    total += i;
  }

  return total;
}

int square(int x) {
  return x * x;
}

int main(void) {
  int x = 20;

  if (x > 0) {
    printf("positive\n");
  } else {
    printf("not a positive\n");
  }

  for (int i = 0; i < 5; i++) {
    printf("%d\n", i);
  }

  while (x > 0) {
    x -= 1;
  }

  int sq_result = square(x);
  printf("%d\n", sq_result);

  int n = 10;

  if (is_even(n)) {
    printf("%d is even\n", n);
  } else {
    printf("%d is odd\n", n);
  }

  printf("sum_to(%d) = %d\n", n, sum_to(n));

  return 0;
}