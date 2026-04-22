/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: 'node',
	extensionsToTreatAsEsm: ['.ts'],
	transform: {
		'^.+\\.ts$': ['ts-jest', { useESM: true }],
	},
};
