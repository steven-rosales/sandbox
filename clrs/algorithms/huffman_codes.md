# Huffman Codes

## **_15.3-1_**

Explain why, in the proof of Lemma 15.2, if $x.freq = b.freq$, then we must have

$$
\begin{aligned}
a.freq = b.freq = x.freq = y.freq
\end{aligned}
$$

**_Solution_**

From the proof, we already know that $a$ and $b$ are ordered by frequency, and $x$ and $y$ are the two lowest-frequency characters, also in order:

$$
\begin{aligned}
a.freq &\le b.freq \\
x.freq &\le y.freq
\end{aligned}
$$

Since $x$ and $y$ are the two lowest frequencies, they must also be less than or equal to the arbitrary frequencies $a$ and $b$:

$$
\begin{aligned}
x.freq &\le a.freq \\
y.freq &\le b.freq
\end{aligned}
$$

Now suppose that

$$
\begin{aligned}
x.freq = b.freq
\end{aligned}
$$

Then $a.freq$ is squeezed between $x.freq$ and $b.freq$:

$$
\begin{aligned}
x.freq \le a.freq \le b.freq
\end{aligned}
$$

But if the left side and right side are equal, then $a.freq$ has nowhere else to go:

$$
\begin{aligned}
a.freq = x.freq = b.freq
\end{aligned}
$$

The same thing happens with $y.freq$:

$$
\begin{aligned}
x.freq \le y.freq \le b.freq
\end{aligned}
$$

Again, since $x.freq = b.freq$, we get

$$
\begin{aligned}
y.freq = x.freq = b.freq
\end{aligned}
$$

Therefore, all four frequencies must be equal:

$$
\begin{aligned}
a.freq = b.freq = x.freq = y.freq
\end{aligned}
$$

So the reason the proof calls this case trivial is that there is no meaningful frequency difference between $a$, $b$, $x$, and $y$. They all have the same frequency, so swapping them around in the Huffman tree does not change the cost of the code.

## **_15.3-2_**

Prove that a non-full binary tree cannot correspond to an optimal prefix-free code.

**_Solution_**

Suppose we have a binary tree $T$ that represents a prefix-free code, but $T$ is not full. That means there is some internal node $y$ with exactly one child. Let that child be $x$, where $x$ is the root of some subtree.

So locally, the tree looks like this:

```text
    y
    |
    x
   / \
  ...
```

The node $y$ is not helping us make a binary choice. It only forces every codeword in the subtree rooted at $x$ to become one bit longer.

Now construct a new tree $T'$ by contracting the edge from $y$ to $x$. In other words, we remove $y$ and move the subtree rooted at $x$ up by one level.

Every leaf $c$ inside the subtree rooted at $x$ has its depth decreased by $1$:

$$
\begin{aligned}
d_{T'}(c) = d_T(c) - 1
\end{aligned}
$$

Every leaf outside that subtree keeps the same depth.

The new tree $T'$ still represents a valid prefix-free code. We did not turn any character into an ancestor of another character. We only removed a useless unary step from the path to the leaves in $x$'s subtree.

Now compare the costs. The cost of a prefix-free code tree is

$$
\begin{aligned}
B(T) = \sum_{c \in C} c.freq \cdot d_T(c)
\end{aligned}
$$

Since every leaf in the subtree rooted at $x$ moves up by one level, the cost decreases by the sum of the frequencies of those leaves:

$$
\begin{aligned}
B(T') = B(T) - \sum_{c \in C_x} c.freq
\end{aligned}
$$

where $C_x$ is the set of characters stored in the leaves of the subtree rooted at $x$.

Because every character frequency is positive, we have

$$
\begin{aligned}
\sum_{c \in C_x} c.freq > 0
\end{aligned}
$$

Therefore,

$$
\begin{aligned}
B(T') < B(T)
\end{aligned}
$$

So the original tree $T$ could not have been optimal. If a tree has a unary internal node, we can contract it, keep the code prefix-free, and strictly decrease the expected code length. Thus, an optimal prefix-free code tree must be full.

$$
\tag*{$\square$}
$$
