/**
 * Core Idea:
 * x = value
 * &x = address of x
 * p = address stored in pointer
 * *p = value at that address
 */

#include <stdio.h>
#include <stdlib.h>

void change(int *p) {
  *p = 99;
}

void swap(int *a, int *b) {
  int a_val = *a;
  int b_val = *b;

  *a = b_val;
  *b = a_val;
}

int main(void) {
  int x = 10;
  printf("%p\n", (void *)&x); // Memory address

  int *p = &x; // Pointer to x's value at that address
  printf("%d\n", *p);

  *p = 20; // value change
  printf("%d\n", x); // print changed value

  change(&x);
  printf("%d\n", x);

  int a = 1;
  int b = 2;
  swap(&a, &b);
  printf("a=%d b=%d\n", a, b); // x=2 y=1

  return 0;
}

