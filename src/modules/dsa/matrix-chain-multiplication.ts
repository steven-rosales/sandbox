type MatrixChainOptimal = { m: number[][]; s: number[][] };

/**
 * Computes the minimum scalar-multiplication costs for a chain of matrices and
 * records the split points needed to reconstruct an optimal parenthesization.
 *
 * Uses a bottom-up dynamic programming approach: it fills the tables for shorter
 * subchains first, then uses those results to solve longer subchains.
 *
 * @param p The dimension array where matrix A_i has dimensions p[i] × p[i + 1].
 * @returns An object `{ m, s }` where `m[i][j]` is the minimum cost of computing
 * the product A_i...A_j, and `s[i][j]` is the split index `k` that achieves that cost.
 */
export function matrixChainOrder(p: number[]): MatrixChainOptimal {
	const n = p.length - 1;

	const m: number[][] = Array.from({ length: n }, () =>
		Array.from({ length: n }, () => 0),
	);
	const s: number[][] = Array.from({ length: n }, () =>
		Array.from({ length: n }, () => 0),
	);

	for (let i = 0; i < n; i++) {
		m[i]![i]! = 0;
	}

	for (let l = 2; l <= n; l++) {
		for (let i = 0; i <= n - l; i++) {
			const j = i + l - 1;
			m[i]![j]! = Number.POSITIVE_INFINITY;

			for (let k = i; k < j; k++) {
				const q = m[i]![k]! + m[k + 1]![j]! + p[i]! * p[k + 1]! * p[j + 1]!;
				if (q < m[i]![j]!) {
					m[i]![j]! = q;
					s[i]![j]! = k;
				}
			}
		}
	}

	return { m, s };
}

/**
 * The `s` table contains the information needed to determine the earlier matrix multiplications as well, using recursion: s[1, s[1, n]] determines the last matrix multiplication when compution A_1:s[1, n] and s[s[1, n] + 1, n] determines the last matrix multiplication when computing A_s[1, n] + 1: n
 */
export function printOptimalParens(
	s: number[][],
	i: number,
	j: number,
): string {
	if (i === j) return `A${i + 1}`;

	const k = s[i]![j]!;
	return `(${printOptimalParens(s, i, k)} x ${printOptimalParens(s, k + 1, j)})`;
}
