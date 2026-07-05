# Elements of Greedy

## **_15.2-1_**

Prove that the fractional knapsack problem has the greedy-choice property.

**Solution**

Suppose there is a set of items $n$, where each item k has value $v_k$ and weight $w_k$, and they are sorted by their value-to-weight ratio monotonically non-increasing (in other words, decreasing) order, such that

$$
\begin{aligned}
\frac{v_1}{w_1} \ge \frac{v_2}{w_2} \ge \cdots \ge \frac{v_n}{w_n}
\end{aligned}
$$

Let $W$ be the maximum capacity of a knapsack. Then, there exists a globally optimal solution to the fractional knapsack problem that includes as much as possible of the item with the highest ratio (item 1). Specifically, the optimal solution includes a weight $x_1$ of item 1, where $x_1 = \min(w_1, W)$

_proof_ Let $O$ be an optimal solution to the fractional knapsack problem. Let item 1 be the item with the highest value-to-weight ratio, $\frac{v_1}{w_1}$. The maximum amount of item 1 we can take is $x_1 = \min(w_1, W)$. If $O$ contains the maximum possible amount of item 1 ($x_1$), the greedy property holds and we're done. If $O$ does not contain the maximum possible amount of item 1, it contains some amount $y_1 < x_1$. Because the knapsack is full (or all items are exhausted), $O$ must contain some positive weight $y_j > 0$ of another item $j$ (where $j > 1$).

Let $w = \min(x_1 - y_1, y_j)$. This is the amount of weight we can swap. We construct a new solution $O'$ by removing the weight $w$ of item $j$ from $O$ and replacing it with the weight $w$ of item 1. To find the total value of the new soution, $V(O')$, we take the value of $O$, add the value of the new item 1 fraction, and subract the value of the removed item $j$ fraction:

$$
\begin{aligned}
V(O') = V(O) + w(\frac{v_1}{w_1}) - w(\frac{v_j}{w_j})
\end{aligned}
$$

Because the items are sorted such that $\frac{v_1}{w_1} \ge \frac{v_j}{w_j}$, it must be true that $w(\frac{v_1}{w_1}) - w(\frac{v_j}{w_j}) > 0$. Therefore, $V(O') > V(O)$.

Since $O$ was assumed to be an optimal solution, it is impossible for $V(O')$ to be strictly greater than $V(O)$. Thus $V(O') = V(O)$, meaning $O'$ is also optimal solution. By repeating this exchange until the knapsack contains $x_1$ of item 1, we prove that an optimal solution containing the greedy choice exists.
