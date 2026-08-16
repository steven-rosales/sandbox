import { parentPort, workerData } from "node:worker_threads";

type Input = Readonly<{ maximum: number }>;

const input = workerData as Input;

function countPrimes(maximum: number): number {
  let count = 0;

  for (let candidate = 2; candidate <= maximum; candidate++) {
    let prime = true;

    const limit = Math.floor(Math.sqrt(candidate));

    for (let divisor = 2; divisor <= limit; divisor++) {
      if (candidate % divisor === 0) {
        prime = false;
        break;
      }
    }

    if (prime) count++;
  }

  return count;
}

const result = countPrimes(input.maximum);

parentPort?.postMessage(result);
