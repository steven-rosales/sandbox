/**
 * struct = grouped memory
 * . = field access through value
 * -> = field access through pointer
 * enum = named integers
 * typedef = alias for a type
 * 
 * In general, when the pointer points to a struct or union, use ->. Use this for a pointer to a struct/union, which is common in data strcutres. Do not use it in primitves, instead use, for example, *p = 10.
 */

#include <stdio.h>

typedef struct {
  int x;
  int y;
} Point;

typedef enum {
  RED,
  GREEN,
  BLUE
} Color;

typedef struct {
  char c;
  int x;
} Example;

void move (Point *p, int dx, int dy) {
  p->x = p->x + dx;
  p->y = p->y + dy;
}

int main(void) {
  Point p = {'a', 20};
  printf("%d\n", p.x);
  printf("%d\n", p.y);

  Point *ptr = &p;
  printf("%d\n", ptr->x);
  printf("%d\n", ptr->y);

  move(&p, 5, -3);
  printf("(%d, %d)\n", p.x, p.y);

  Color c = GREEN;
  // Color b = BLACK; // Undefined

  if (c == GREEN) {
    printf("green\n");
  }

  printf("%zu\n", sizeof(Example));
  printf("%zu\n", sizeof(Point));

  return 0;
}


