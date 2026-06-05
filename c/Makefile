CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -g

main: main.c
	$(CC) $(CFLAGS) main.c -o main

primitives: primitives.c
	$(CC) $(CFLAGS) primitives.c -o primitives

flow_functions: flow_functions.c
	$(CC) $(CFLAGS) flow_functions.c -o flow_functions

clean:
	rm -f main