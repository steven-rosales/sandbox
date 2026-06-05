#include <stdio.h>

int string_length(char *s) {
  int n = 0;

  while (s[n] != '\0') {
    n += 1;
  }

  return n;
}

int sum_array(int *xs, int length) {
  int total = 0;

  for (int i = 0; i < length; i++) {
    total += xs[i];
  }

  return total;
}

int main(void) {
  int ys[3] = {10, 20, 30};

  printf("%d\n", ys[0]);
  printf("%d\n", ys[1]);

  int *p = ys;

  printf("%d\n", *p);
  printf("%d\n", *(p + 1));
  printf("%d\n", *(p + 2));

  char s[] = "cat";
  printf("%s\n", s);

  for (int i = 0; s[i] != '\0'; i++) {
    printf("%c\n", s[i]);
  }

  int xs[] = {10, 20, 30, 40};
  char word[] = "hello";

  printf("xs[0] = %d\n", xs[0]);
  printf("*(xs + 1) = %d\n", *(xs + 1));

  printf("sum = %d\n", sum_array(xs, 4));
  printf("length = %d\n", string_length(word));

  return 0;
}