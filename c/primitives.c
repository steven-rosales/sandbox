/**
 * Type               | `printf`
 * int                | %d
 * long               | %ld
 * double             | %f
 * char (character)   | %c
 * char (integer)     | %d
 * size_t             | %zu
 */

#include <stdio.h>

int main(void) {
  int x = 43;
  long y = 100000001;
  double z = 3.14;
  char c = 'A';

  printf("x = %d\n", x);
  printf("y = %ld\n", y);
  printf("z = %f\n", z);
  printf("c = %c\n", c);

  printf("5 / 2 = %d\n", 5 / 2);
  printf("5.0 / 2 = %f\n", 5.0 / 2);

  printf("sizeof int = %zu\n", sizeof(int));
  printf("sizeof long = %zu\n", sizeof(long));
  printf("sizeof double = %zu\n", sizeof(double));
  printf("sizeof char = %zu\n", sizeof(char));

  return 0;
}