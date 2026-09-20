import { describe, it, beforeEach, expect } from "vitest";

import { AgentMetrics } from "./54-metrics.js";

let metrics: AgentMetrics;

beforeEach(() => {
  metrics = new AgentMetrics();
});

describe("metrics", () => {
  it("records HTTP requests and device commands", () => {
    metrics.recordHttp("POST", "/api/orders", 200, 73);
    metrics.recordDeviceCommand("get all orders", "ok", 73);

    expect(metrics.snapshot()).toMatchObject({
      httpRequests: { "POST|/api/orders|200": 1 },
      deviceCommands: { "get all orders|ok": 1 },

      httpDurationMs: { count: 1, sum: 73, minimum: 73, maximum: 73 },
      deviceDurationMs: { count: 1, sum: 73, minimum: 73, maximum: 73 },
    });
  });

  it("increments the counter when the same HTTP request is recorded multiple times", () => {
    metrics.recordHttp("GET", "/api/orders", 200, 20);
    metrics.recordHttp("GET", "/api/orders", 200, 40);
    metrics.recordHttp("GET", "/api/orders", 200, 60);

    expect(metrics.snapshot()).toMatchObject({
      httpRequests: { "GET|/api/orders|200": 3 },
      httpDurationMs: { count: 3, sum: 120, minimum: 20, maximum: 60 },
    });
  });

  it("places HTTP durations into the correct histogram buckets", () => {
    metrics.recordHttp("GET", "/api/orders", 200, 3);
    metrics.recordHttp("GET", "/api/orders", 200, 73);
    metrics.recordHttp("GET", "/api/orders", 200, 6_000);

    expect(metrics.httpDurationMs.snapshot()).toEqual({
      boundaries: [5, 10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000],
      counts: [
        1, // <= 5
        0, // <= 10
        0, // <= 25
        0, // <= 50
        1, // <= 100: 73ms
        0, // <= 250
        0, // <= 500
        0, // <= 1000
        0, // <= 2500
        0, // <= 5000
        1, // > 5000: 6000ms
      ],
      count: 3,
      sum: 6_076,
      minimum: 3,
      maximum: 6_000,
    });
  });
});
