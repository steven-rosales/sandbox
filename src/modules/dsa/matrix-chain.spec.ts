import { expect, test, describe } from '@jest/globals';
import {
	matrixChainOrder,
	printOptimalParens,
} from './matrix-chain-multiplication';
import {
	memoizedMatrixChain,
	recursiveMatrixChain,
} from './recursive-memoized-matrix-chain';

describe('matrix-chain multiplication using bottom up and top down', () => {
	test('checks if the bottom up iterative matrix chain order is optimal', () => {
		const p = [30, 35, 15, 5, 10, 20, 25];
		const { s } = matrixChainOrder(p);

		const optimal = printOptimalParens(s, 0, p.length - 2);

		expect(optimal).toBe(`((A1 x (A2 x A3)) x ((A4 x A5) x A6))`);
	});

	test('check if the top down recursive matrix chain order is optimal', () => {
		const p = [30, 35, 15, 5, 10, 20, 25];

		const optimal = memoizedMatrixChain(p, p.length - 1);

		expect(optimal).toBe(15125);
	});

	test('two matrices has the direct multiplication cost', () => {
		const p = [10, 20, 30];

		expect(recursiveMatrixChain(p, 1, 2)).toBe(10 * 20 * 30);
		expect(memoizedMatrixChain(p, 2)).toBe(10 * 20 * 30);
	});
});
