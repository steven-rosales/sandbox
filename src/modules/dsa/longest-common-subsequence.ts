/**
 * Def: A **subsequence** of a given sequence is just the given sequence with 0 or more elements left out. Formally, given a sequence X = <x_1, x_2, ..., x_n>, another sequence Z = <z_1, z_2, ..., z_k> is a subsequence of X if there exists a strictly increasing sequence <i_1, i_2, ..., i_k> of indices of X such that for all j = 1, 2, ..., k, we have x_ij = z_j.
 *
 * Def: In the **longest-common-subsequence problem** (LCS), the input is two sequences X = <x_1, x_2, ..., x_m> and Y = <x_1, x_2, ..., x_n>, and the goal is to find a maximum-length common subsequence of X and Y.
 */

/**
 * Theorem (Optimal substructure of an LCS): Let X = <x_1, x_2, ..., x_n> and Y = <y_1, y_2, ..., y_n> be sequences, and let Z = <z_1, z_2, ..., z_k> be any LCS of X and Y.
 * 1. If x_m = y_n, then z_k = x_m = y_n and Z_k-1 is an LCS of X_m-1 and Y_n-1.
 * 2. If x_m != y_n and z_k != x_m, then Z is an LCS of X_m-1 and Y.
 * 3. If x_m != y_n and z_k !=y_n, then Z is an LCS of X is an LCS of X and Y_n-1
 */

/**
 * Takes two sequences X = <x_1, x_2, ..., x_m> and Y = <y_1, y_2, ..., y_m> as inputs, along with their lengths. It stores the c[i, j] values in a table c[0:m, 0:n], and it computes the entries in **row major** order. That is, the procedure fills in the first row of c from left to right, then the second row, and so on.
 *
 * The procedure also maintains b[1:m, 1:n] to help in constructing an optimal solution. Intuitively, b[i, j] points to the table entry corresponding to the optimal subproblem solution chosen when computing c[i, j].
 *
 * It returns the b and c tables, where c[m, n] contains the length of an LCS of X and Y.
 */
export function lcsLength(x: string, y: string): LCSResult {
	const m = x.length;
	const n = y.length;

	const c: number[][] = Array.from({ length: m + 1 }, () =>
		Array(n + 1).fill(0),
	);
	const b: (Arrow | null)[][] = Array.from({ length: m + 1 }, () =>
		Array<Arrow | null>(n + 1).fill(null),
	);

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (x[i - 1] === y[i - 1]) {
				c[i]![j]! = c[i - 1]![j - 1]! + 1;
				b[i]![j]! = 'diag';
			} else if (c[i - 1]![j]! >= c[i]![j - 1]!) {
				c[i]![j]! = c[i - 1]![j]!;
				b[i]![j]! = 'up';
			} else {
				c[i]![j]! = c[i]![j - 1]!;
				b[i]![j]! = 'left';
			}
		}
	}

	return { c, b };
}

type LCSResult = {
	c: number[][];
	b: (Arrow | null)[][];
};

type Arrow = 'diag' | 'up' | 'left';

export function printLcs(
	b: (Arrow | null)[][],
	x: string,
	i: number,
	j: number,
): string {
	if (i === 0 || j === 0) return '';

	if (b[i]![j]! === 'diag') return printLcs(b, x, i - 1, j - 1) + x[i - 1];

	if (b[i]![j]! === 'up') return printLcs(b, x, i - 1, j);

	return printLcs(b, x, i, j - 1);
}

export function lcs(x: string, y: string): string {
	const { b, c } = lcsLength(x, y);
	const sequence = printLcs(b, x, x.length, y.length);

	console.log(`LCS length: ${c[x.length]![y.length]!}\nLCS: ${sequence}`);

	return sequence;
}

const x = 'ABCBDAB';
const y = 'BDCABA';
lcs(x, y);
