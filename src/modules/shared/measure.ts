export function measure(name: string, fn: () => unknown, iterations = 50) {
	for (let i = 0; i < 10; i++) fn();

	const times: number[] = [];

	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		fn();
		const end = performance.now();
		times.push(end - start);
	}

	const avg = times.reduce((a, b) => a + b, 0) / times.length;
	const min = Math.min(...times);
	const max = Math.max(...times);

	console.log(
		`${name}: \n avg = ${avg.toFixed(3)}ms \n min = ${min.toFixed(3)}ms \n max = ${max.toFixed(3)}ms`,
	);
}
