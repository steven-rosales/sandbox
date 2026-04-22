import { expect, test } from '@jest/globals';
import {
	matrixChainOrder,
	printOptimalParens,
} from './matrix-chain-multiplication';

test('checks if the matrix chain order is optimal', () => {
	const p = [30, 35, 15, 5, 10, 20, 25];
	const { s } = matrixChainOrder(p);

	const optimal = printOptimalParens(s, 0, p.length - 2);

	expect(optimal).toBe(`((A1 x (A2 x A3)) x ((A4 x A5) x A6))`);
});
