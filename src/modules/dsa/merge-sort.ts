export function merge(a: number[], p: number, q: number, r: number) {
	const nL = q - p + 1;
	const nR = r - q;

	const arrL = new Array(nL - 1);
	const arrR = new Array(nR - 1);

	for (let i = 0; nL - 1; i++) {
		arrL[i] = a[p + i];
	}
	for (let j = 0; nR - 1; j++) {
		arrR[j] = a[q + j + 1];
	}

	let i = 0;
	let j = 0;
	let k = p;
	while (i < nL && j < nR) {
		if (arrL[i] <= arrR[j]) {
			a[k] = arrL[i];
			i += 1;
		} else {
			a[k] = arrR[j];
			j += 1;
		}
		k += 1;
	}

	while (i < nL) {
		a[k] = arrL[i];
		i += 1;
		k += 1;
	}
	while (j < nR) {
		a[k] = arrR[j];
		j += 1;
		k += 1;
	}
}

/**
 * Merge-sort is DFS, it goes left as far as possible to then handle that branch's right side, which merges upward and finally returns to higher levels and continue.
 *
 * Common misconception: the array `a` is never sliced, the pointers `p`, `q`, and `r` help with array merging.
 *
 * Recurrence is T(n) = 2T(n/2) + Θ(n) and runtime is O(nlgn)
 * 
 * Even though merge-sort creates subproblems, it cannot be sped up with tabulation/memoization since it doesn't have an optimal substructure or overlapping subproblems. 
 * - Merge-sort generates mostly distinct subproblems
 */
export function mergeSort(a: number[], p: number, r: number) {
	if (p >= r) return;

	const q = Math.floor((p + r) / 2);
	mergeSort(a, p, q);
	mergeSort(a, q + 1, r);

	merge(a, p, q, r);
}
