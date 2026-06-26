# Activity Selector

## **_15.1-2_**

Suppose that instead of always selecting the first activity to finish, you instead select the last activity to start that is compatible with all previously selected activities. Describe how this approach is a greedy algorithm, and prove that it yields an optimal solution.

**Theorem**: Consider any nonempty subproblem $S_k$, and let $a_m$ be the activity in $S_k$ with the latest start time. Then $a_m$ is included in some maximum-size subset of mutually compatible activites of $S_k$.

**_proof_** Let $A_k$ be a maximum-size subset of mutually compatible activities $S_k$, and let $a_i$ be the activity in $A_k$ with the latest start time (chronologically, the last one to start in $A_k$). If $a_i = a_m$, we are done, since $a_m$ in $A_k$.

If $a_i \ne a_m$, we construct a new set $A'_k = (A_k \setminus \{a_i\} \cup \{a_m\})$ by substituting $a_i$ with out greedy choice $a_m$. We must now show that the activities in $A'_k$ remain mutually compatible. The activities $A'_k$ are compatible. Since $a_i$ is the last activitiy in $A_k$ to start, any other activities $a_x$ in $A_k \setminus \{a_i\}$ must finish before $a_i$ starts ($f_x \le s_i$). Because $a_m$ is the greedy choice with the absolute latest start time in $S_k$, we know that $s_m \ge s_i$. Combining these inequialities gives $f_x \le s_i \le s_m$, which implies $f_x \le s_m$.

Thus, every other activity in the set safely finished before $a_m$ begins. Since all activites in $A'_k$ are compatible and $|A'_k| = |A_k|$, we conclude that $A'_k$ is a maximum size subste of mutually compatible activities of $S_k$, and it explicitly includes $a_m$.
