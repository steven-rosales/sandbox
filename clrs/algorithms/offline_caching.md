# Offline Caching

## **_Theorem 15.5_**

Optimal offline caching has the greedy-choice property.

**_Intuition_**

The theorem is saying that, for any full-cache miss subproblem $(C, i)$, there exists an optimal solution that evicts the block whose next use is furthest in the future.

Let

$$
\begin{aligned}
S &= \text{an optimal plan we use as the benchmark} \\
S' &= \text{a modified plan that evicts } z \text{ first} \\
z &= \text{the block in } C \text{ whose next use is furthest in the future}
\end{aligned}
$$

Also, the notation

$$
\begin{aligned}
C_{S,j}
\end{aligned}
$$

means the cache contents under solution $S$ right before request $b_j$ happens.

So $C_{S,j}$ is not a new algorithm. It is just a snapshot of the cache if we follow plan $S$ up to request $j$.

The proof compares two worlds:

```text
S  = some optimal plan that might evict x
S' = a modified plan that evicts z instead
```

The four properties are basically saying this:

First, $S'$ stays close to $S$. After $S'$ evicts $z$ and $S$ evicts $x$, their caches differ by at most one block. So $S'$ is not going rogue. It is shadowing the optimal plan $S$.

Second, before $z$ is needed again, $S'$ does not lose hits that $S$ gets. Since $z$ is furthest in the future, requests before that time cannot be for $z$. So evicting $z$ early has not hurt us yet.

Third, when $z$ finally appears again, $S'$ can load it back and resync with $S$. After that point, the proof arranges the cache states so that

$$
\begin{aligned}
C_{S,j} = C_{S',j}
\end{aligned}
$$

for the remaining requests.

Fourth, because $S'$ does not lose extra hits before $z$ returns, and because it can copy $S$ after the caches resync, $S'$ has no more misses than $S$.

Since $S$ was already optimal, $S'$ is also optimal. Therefore, evicting the furthest-in-future block is compatible with optimality.

That is the greedy-choice property:

$$
\begin{aligned}
\text{there exists an optimal solution that begins with the greedy eviction.}
\end{aligned}
$$
