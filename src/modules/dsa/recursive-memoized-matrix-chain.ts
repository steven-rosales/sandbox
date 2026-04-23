/**
 * # Optimal substructure
 *
 * Def: A problem exhibits **optimal substructure** if an optimal solution to the problem contains within it optimal solutions to subproblems
 *
 * Informally, the running time of a dynamic-programming algorithm depends on the product of two factors: the number of subproblems overall and how many choices you look at for each subproblem.
 * - Usually, the subproblem graph gives an alternative way to perform the same analysis. Each vertex corresponds to a subproblem, and the choices for a subproblem are the edges incident from that subproblem.
 *
 * To prove a dynamic programming structure, assume an optimal first choice, identify the resulting subproblems, and show by contradiction that each subproblem must also be solved optimally.
 *
 * Dynamic programming often uses optimal substructure in a bottom-up fashion. That is, you first find optimal solutions to subproblems and, having solved the subproblems, you find an optimal solution ot a problem
 *
 * Def: **Independence of subproblems** is when the solution to one subproblem does not affect the solution to another subproblem subproblem of the same problem.
 * - E.g., Unwheighted shortest path is has independent subproblem while unweighted longest simple path does not.
 */

/**
 * # Overlapping subproblems
 *
 * Def: **Overlapping subproblems** is when a recursive algorithm revisits the same problem repeatedly for a optimization problem.
 *
 * Dynamic programming algorithms typically take advantage of overlapping subproblems by solving each subproblem once and then storing the solution in a table where it can be looked up when needed, using constant time per lookup.
 */

/**
 * Very inefficient recursive procedure, recomputes each vertex (subproblem) every time.
 *
 * Based on recurrence (14.7) in CLRS. It takes the exponential time O(2^n).
 */
export function recursiveMatrixChain(
	p: number[],
	i: number,
	j: number,
): number {
	if (i === j) return 0;

	let min = Number.POSITIVE_INFINITY;

	for (let k = i; k < j; k++) {
		const q =
			recursiveMatrixChain(p, i, k)! +
			recursiveMatrixChain(p, k + 1, j)! +
			p[i - 1]! * p[k]! * p[j]!;

		if (q < min) min = q;
	}

	return min;
}

/**
 * Memoized recursive algorithm for matrix-chain multiplication. It maintains a table m[1:n, 1:n] of computed values of m[i, j], the minimum number of scalar multiplcations needed to compute hte matrix A_i:j.
 */
export function memoizedMatrixChain(p: number[], n: number) {
	const m = Array.from({ length: n + 1 }, () =>
		Array.from({ length: n + 1 }, () => Number.POSITIVE_INFINITY),
	);

	return lookupChain(m, p, 1, n);
}

export function lookupChain(
	m: number[][],
	p: number[],
	i: number,
	j: number,
): number {
	if (m[i]![j]! < Number.POSITIVE_INFINITY) return m[i]![j]!;

	if (i === j) {
		m[i]![j]! = 0;
	} else {
		for (let k = i; k < j; k++) {
			const q =
				lookupChain(m, p, i, k) +
				lookupChain(m, p, k + 1, j) +
				p[i - 1]! * p[k]! * p[j]!;

			// Since it is top down, the `i` and `j` stay the same after all recursive calls, and the upper right triangle is filled after the recursive calls as well.
			if (q < m[i]![j]!) {
				m[i]![j]! = q;
			}
		}
	}

	return m[i]![j]!;
}

import { measure } from '../shared/measure.ts';

const p = [30, 35, 15, 5, 10, 20, 25];

measure('recursiveMatrixChain', () => {
	recursiveMatrixChain(p, 1, p.length - 1);
});

measure('memoizedMatrixChain', () => {
	memoizedMatrixChain(p, p.length - 1);
});
