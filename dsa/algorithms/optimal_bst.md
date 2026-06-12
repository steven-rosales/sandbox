# Optimal Binary Search Tree

## **_14.5-1_**

Write pseudocode for the procedure `CONSTRUCT-OPTIMAL-BST(root, n)` which, given the table $root[1:n, 1:n]$, outputs the structure of an optimal binary search tree. For the example in Figure 14.10, your procedure should print out the structure

$$
\begin{aligned}
k_2 &\text{ is the root} \\
k_1 &\text{ is the left child of } k_2 \\
d_0 &\text{ is the left child of } k_1 \\
d_1 &\text{ is the right child of } k_1 \\
k_5 &\text{ is the right child of } k_2 \\
k_4 &\text{ is the left child of } k_5 \\
k_3 &\text{ is the left child of } k_4 \\
d_2 &\text{ is the left child of } k_3 \\
d_3 &\text{ is the right child of } k_3 \\
d_4 &\text{ is the right child of } k_4 \\
d_5 &\text{ is the right child of } k_5
\end{aligned}
$$

corresponding to the optimal binary search tree shown in Figure 14.9(b).

**_Solution_**

We define a recursive auxiliary procedure that will construct the subtree containing keys $k_i, \ldots, k_j$. The table entry $root[i, j]$ gives the root of the give subtree.

```text
Construct-Optimal-BST(root, n)
    r = root[1, n]
    print k_r is the root
    Construct-Optimal-BST-Aux(root, 1, r - 1, r, left)
    Construct-Optimal-BST-Aux(root, r + 1, n, r, right)

Construct-Optimal-BST-Aux(root, i, j, parent, side)
    if i > j
        print d_j is the side child of k_parent
        return
    r = root[i, j]
    print k_r is the side child of k_parent
    Construct-Optimal-BST-Aux(root, i, r - 1, r, left)
    Construct-Optimal-BST-Aux(root, r + 1, j, r, right)
```

The first call finds the root of the whole tree using $root[1, n]$. Each recursive call then uses $root[i, j]$ to find the root of the current subtree. The condition $i > j$ means that the subtree is empty, so the corresponding dummy key $d_j$ is printed.

## **_14.5-3_**

Suppose that instead of maintaining the table $w[i, j]$, you computed the value $w(i, j)$ directly from equation (14.12) in line 9 of $\mathrm{OPTIMAL\text{-}BST}$ and used this computed value in line 11. How would this change affect the asymptotic running time of $\mathrm{OPTIMAL\text{-}BST}$?

**_Solution_**

The original cost is

$$
\sum_{\ell=1}^{n} \sum_i \sum_{r=i}^{j} 1 = \Theta(n^3)
$$

since $w[i, j]$ is already available in $\Theta(1)$.

With no table, it costs

$$
\Theta(j - i + 1) = \Theta(\ell)
$$

That computation happens inside the inner $r$-loop, so for each interval of length $\ell$:

$$
\Theta(\ell)\text{ roots} \times \Theta(\ell)\text{ to compute } w(i, j) = \Theta(\ell^2)
$$

There's $n-\ell+1$ intervals of length $\ell$, so total is

$$
\sum_{\ell=1}^{n} (n-\ell+1)\ell^2 = \Theta(n^4)
$$

and thus, the running time:

$$
\boxed{\Theta(n^4)}
$$
