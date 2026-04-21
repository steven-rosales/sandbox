type MatrixChainOptimal = { m: number[][]; s: number[][] };

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

	for (let l = 1; l < n; l++) {
		for (let i = 0; i < n - l + 1; i++) {
			const j = i + l - 1;
			m[i]![j]! = Number.POSITIVE_INFINITY;

			for (let k = i; k < j - 1; k++) {
				const q = m[i]![k]! + m[k + 1]![j]! + p[i - 1]! * p[k]! * p[j]!;
				if (q < m[i]![j]!) {
					m[i]![j]! = q;
					s[i]![j]! = k;
				}
			}
		}
	}

	return { m, s };
}

export function printOptimalParens(s: number[][], i: number, j: number) {
	if (i === j) {
		console.log('A');
	} else {
		console.log(
			`(${printOptimalParens(s, i, s[i]![j]!)} \n ${printOptimalParens(s, s[i]![j]! + 1, j)})`,
		);
	}
}
