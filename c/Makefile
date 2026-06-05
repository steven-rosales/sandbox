CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -g

main: main.c
	$(CC) $(CFLAGS) main.c -o main

primitives: primitives.c
	$(CC) $(CFLAGS) primitives.c -o primitives

flow_functions: flow_functions.c
	$(CC) $(CFLAGS) flow_functions.c -o flow_functions

memory: memory.c
	$(CC) $(CFLAGS) memory.c -o memory

bst: bst.c
	$(CC) $(CFLAGS) bst.c -o bst

clean:
	rm -f main