export type HistogramSnapshot = {
  boundaries: number[];
  counts: number[];
  count: number;
  sum: number;
  minimum: number | null;
  maximum: number | null;
};

export class FixedHistorgram {
  readonly #boundaries: number[];
  readonly #counts: number[];

  #count = 0;
  #sum = 0;

  #minimum: number | null = null;
  #maximum: number | null = null;

  public constructor(boundaries: number[]) {
    this.#boundaries = [...boundaries].sort((left, right) => left - right);

    // One final bucket represents values above the largest configured boundary
    this.#counts = Array.from({ length: this.#boundaries.length + 1 }, () => 0);
  }

  public observe(value: number): void {
    if (!Number.isFinite(value) || value < 0)
      throw new Error(`Invalid histogram value: ${value}`);

    const foundIndex = this.#boundaries.findIndex(
      (boundary) => value <= boundary,
    );

    const bucketIndex =
      foundIndex === -1 ? this.#boundaries.length : foundIndex;

    this.#counts[bucketIndex] = (this.#counts[bucketIndex] ?? 0) + 1;

    this.#count++;
    this.#sum += value;

    this.#minimum =
      this.#minimum === null ? value : Math.min(this.#minimum, value);

    this.#maximum =
      this.#maximum === null ? value : Math.max(this.#maximum, value);
  }

  public snapshot(): HistogramSnapshot {
    return {
      boundaries: [...this.#boundaries],
      counts: [...this.#counts],
      count: this.#count,
      sum: this.#sum,
      minimum: this.#minimum,
      maximum: this.#maximum,
    };
  }
}

export class AgentMetrics {
  readonly #httpRequests = new Map<string, number>();

  readonly #deviceCommands = new Map<string, number>();

  public readonly httpDurationMs = new FixedHistorgram([
    5, 10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000,
  ]);

  public readonly deviceDurationMs = new FixedHistorgram([
    10, 25, 50, 100, 250, 500, 1_000, 2_000, 5_000,
  ]);

  public recordHttp(
    method: string,
    route: string,
    status: number,
    durationMs: number,
  ): void {
    const key = [method, route, status].join("|");

    this.#httpRequests.set(key, (this.#httpRequests.get(key) ?? 0) + 1);

    if (durationMs !== undefined) this.httpDurationMs.observe(durationMs);
  }

  public recordDeviceCommand(
    operation: string,
    status: string,
    durationMs?: number,
  ): void {
    const key = [operation, status].join("|");

    this.#deviceCommands.set(key, (this.#deviceCommands.get(key) ?? 0) + 1);

    if (durationMs !== undefined) this.deviceDurationMs.observe(durationMs);
  }

  public snapshot(): Record<string, unknown> {
    return {
      httpRequests: Object.fromEntries(this.#httpRequests),
      deviceCommands: Object.fromEntries(this.#deviceCommands),
      httpDurationMs: this.httpDurationMs.snapshot(),
      deviceDurationMs: this.deviceDurationMs.snapshot(),
    };
  }
}

export const metrics = new AgentMetrics();
