# Invariants and Computational Thinking

A lot of CS seems to follow the same structure: define a state, make one local change, and preserve some condition that must remain true. This feels inductive because the condition begins true, each step keeps it true, and once the algorithm finishes, that condition gives us the global result.

When solving a problem, I can ask:

- What does my current state represent?
- What must be true before and after every step?
- Why does this operation preserve that truth?
- Why does that truth give me the final answer?

For optimization problems, I should separately ask whether an optimal solution to a smaller subproblem can lead to an optimal solution for the whole problem. An invariant preserves correctness, while optimal substructure explains how optimal pieces build toward a global optimum.

Instead of only memorizing algorithm patterns, I want to understand what truth the algorithm carries forward at every step.
