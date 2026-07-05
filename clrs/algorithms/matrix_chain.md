# Matrix Chain Multiplication

## **_14.2-2_**

Give a recursive algorithm $\mathrm{MATRIX\text{-}CHAIN\text{-}MULTIPLY(A, s, i, j)}$ that actually performs the optimal matrix-chain multiplication, given the sequence of matrices $(A_1, A_2, \ldots, A_n)$, the $s$ table computed by $\mathrm{MATRIX\text{-}CHAIN\text{-}ORDER}$, and the indecies $i$ and $j$. (The initial call is $\mathrm{MATRIX\text{-}CHAIN\text{-}MULTIPLY(A, s, i, j)}$.) Assume that the call $\mathrm{RECTANGULAR\text{-}MATRIX\text{-}MULTIPLY(A, B)}$ returns the product of matrices $A$ and $B$.

**_Solution_**

```txt
MATRIX-CHAIN-MULTIPLY(A, s, i, j)
  if i == j
    return A[i]

  k = s[i, j]

  X = MATRIX-CHAIN-MULTIPLY(A, s, i, k)
  Y = MATRIX-CHAIN-MULTIPLY(A, s, k + 1, j)

  return RECTANGULAR-MATRIX-MULTIPLY(X, Y)
```

## **_14.2-5_**

Let $R(i, j)$ be the number of times that table entry $m[i, j]$ is referenced while computing other table entries in a call of $\mathrm{MATRIX\text{-}CHAIN\text{-}ORDER}$. Show that the total number of references for the entire table is

$$
\begin{aligned}
\sum_{i = 1}^{n}\sum_{j = 1}^{n} R(i, j) = \frac{n^3 - n}{3}
\end{aligned}
$$

**_Solution_**

For a fixed entry $m[i, j]$, it is referenced by larger subproblems that extend either left or right:

$$
\begin{aligned}
R(i, j) = (i - 1) + (n - j) \\
\end{aligned}
$$

Thus,

$$
\begin{aligned}
\sum_{i=1}^{n} \sum_{j=i}^{n} R(i,j)
&=
\sum_{i=1}^{n} \sum_{j=i}^{n} \bigl((i-1) + (n-j)\bigr) \\
&=
\sum_{i=1}^{n} \sum_{j=i}^{n} (i-1)
+
\sum_{i=1}^{n} \sum_{j=i}^{n} (n-j) \\
&=
\sum_{i=1}^{n} (i-1)(n-i+1)
+
\sum_{i=1}^{n} (n-i)i \\
&=
2 \sum_{i=1}^{n} (i-1)(n-i+1) \\
&=
2 \sum_{i=1}^{n} \bigl(-i^2 + (n+2)i - (n+1)\bigr) \\
&=
2 \left(
-\frac{n(n+1)(2n+1)}{6}
+
(n+2)\frac{n(n+1)}{2}
-
n(n+1)
\right) \\
&=
\frac{n^3-n}{3}.
\end{aligned}
$$

as wanted.
