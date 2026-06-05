#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
  int value;
  struct Node *left;
  struct Node *right;
} Node;

/**
 * `node_new` is a function that takes an `int` and returns `Node *`, which is a pointer to a Node.
 */
Node *node_new(int value) {
  // declares a local variable named `node`. It's a pointer to a `Node`. It asks the heap for memory.
  Node *node = malloc(sizeof *node);
  // Node *node = malloc(Node);

  if (node == NULL) {
    fprintf(stderr, "malloc failed\n");
    exit(1);
  }

  // `->` operator is used when you have a pointer to a struct.
  node->value = value;
  // (*node).value = value;
  node->left = NULL;
  node->right = NULL;

  return node;
}

Node *insert(Node *root, int value) {
  if (root == NULL) {
    return node_new(value);
  }

  if (value < root->value) {
    root->left = insert(root->left, value);
  } else if (value > root->value) {
    root->right = insert(root->right, value);
  }

  return root;
}

int contains(Node *root, int value) {
  if (root == NULL) {
    return 0;
  }

  if (value == root->value) {
    return 1;
  }

  if (value < root->value) {
    return contains(root->left, value);
  }

  return contains(root->right, value);
}

void print_in_order(Node *root) {
  if (root == NULL) {
    return;
  }

  print_in_order(root->left);
  printf("%d ", root->value);
  print_in_order(root->right);
}

/**
 * Frees memory address. The nodes will be gone and using `root` is invalid, but still contains the old address that doesn't belong to you.
 */
void free_tree(Node *root) {
  if (root == NULL) {
    return;
  }

  free_tree(root->left);
  free_tree(root->right);
  free(root);
}

int main(void) {
  Node *root = NULL;

  root = insert(root, 5);
  root = insert(root, 3);
  root = insert(root, 7);
  root = insert(root, 1);
  root = insert(root, 4);

  print_in_order(root);
  printf("\n");

  printf("contains 4? %d\n", contains(root, 4));
  printf("contains 9? %d\n", contains(root, 9));

  free_tree(root);
  root = NULL;

  return 0;
}