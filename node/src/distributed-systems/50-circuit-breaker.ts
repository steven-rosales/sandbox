export class CircuitOpenError extends Error {
  public constructor() {
    super("Circuit is open");
    this.name = "CircuitOpenError";
  }
}

/**
 * `closed` (normal operation): circuit is complete, traffic flows normally
 * `open` (failing / fast-fail): downstream services is considered down or unhealthy
 * `half-open` (trial / canary): The cooldown period has expired, and the breaker is testing if the downstream service has recovered
 */
type CircuitState = "closed" | "open" | "half-open";

/**
 * Benefits:
 *
 * **Cascading Failure Prevention**: Keeps your thread pools, database connections, and event loops free instead of blocked waiting on unresponsive third parties.
 *
 * **Autonomous Self-Healing**: The system detects dependency recovery on its own without requiring manual intervention or restarts.
 *
 * **Load Shedding**: Prevents a 'thundering herd' scenario where thousands of queued retries overwhelm a recovering dependency the moment it comes back online.
 */
export class CircuitBreaker {
  #state: CircuitState = "closed";

  #consecutiveFailures = 0;
  #openedAt = 0;
  // concurrency lock (mutex flag) active only the half-open state
  #probeinFlight = false;

  public constructor(
    private readonly failureThreshold: number,
    private readonly resetAfterMs: number,
    private readonly shouldCount: (error: unknown) => boolean,
  ) {}

  public get state(): CircuitState {
    return this.#state;
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now();

    if (this.#state === "open") {
      const elapsed = now - this.#openedAt;
      if (elapsed < this.resetAfterMs) throw new CircuitOpenError();

      this.#state = "half-open";
    }

    if (this.#state === "half-open") {
      // the one trial is happening, don't allow yet
      if (this.#probeinFlight) throw new CircuitOpenError();

      // permits only one trial
      this.#probeinFlight = true;
    }

    try {
      const result = await operation();

      // idempotent if already closed; but transitioned to closed if 'half-open'
      this.#state = "closed";
      this.#consecutiveFailures = 0;

      return result;
    } catch (error: unknown) {
      if (this.shouldCount(error)) {
        this.#consecutiveFailures++;

        // single trial failed again
        if (
          this.#state === "half-open" ||
          this.#consecutiveFailures >= this.failureThreshold
        ) {
          this.#state = "open";
          this.#openedAt = Date.now();
        }
      }

      throw error;
    } finally {
      this.#probeinFlight = false;
    }
  }
}
