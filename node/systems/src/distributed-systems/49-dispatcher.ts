import { hostname } from "node:os";
import { setTimeout as sleep } from "node:timers/promises";

import { pool } from "./41-database.js";
import {
  claimEvents,
  LostLeaseError,
  markFailed,
  markPublished,
  type ClaimedEvent,
} from "./46-outbox.js";

import { CircuitBreaker, CircuitOpenError } from "./50-circuit-breaker.js";
import { DependencyError, submitToProvider } from "./48-provider-client.js";

const shutdownController = new AbortController();
const workerId = `${hostname()}:${process.pid}`;
const concurrency = 4;
const leaseMilliseconds = 10_000;

const providerBreaker = new CircuitBreaker(
  5,
  10_000,
  (error) => error instanceof DependencyError && error.retryable,
);

function classifyFailure(error: unknown): { retryable: boolean } {
  if (error instanceof DependencyError) return { retryable: error.retryable };

  // Invalid event schema and unexpected program errors are not blindly retried here.
  return { retryable: false };
}

async function safelyFail(event: ClaimedEvent, error: unknown): Promise<void> {
  try {
    const classification = classifyFailure(error);

    await markFailed(event, error, classification.retryable);
  } catch (error: unknown) {
    if (error instanceof LostLeaseError) {
      console.warn({
        event: "failure_not_recorded_lost_lease",
        eventId: event.id,
      });
      return;
    }

    /*
      The database may be unavailable.Leave the event processing lease in place. It will eventually expire and be reclaimed.
    */
    console.error({
      event: "failure_recording_failed",
      eventId: event.id,
      error,
    });
  }
}

async function processEvent(event: ClaimedEvent): Promise<void> {
  let providerResult: Awaited<ReturnType<typeof submitToProvider>>;

  try {
    providerResult = await providerBreaker.execute(() =>
      submitToProvider(event, shutdownController.signal, false),
    );
  } catch (error: unknown) {
    // Do NOT increment event failure count or burn retry attempts.
    // Simply return; the lease will expire and be picked up once the circuit closes
    if (error instanceof CircuitOpenError) return;

    await safelyFail(event, error);
    return;
  }

  try {
    await markPublished(event, providerResult.providerReference);

    console.log({
      event: "outbox_event_published",
      eventId: event.id,
      orderId: event.aggregateId,
      attempts: event.attempts,
      leaseToken: event.leaseToken,
    });
  } catch (error: unknown) {
    if (error instanceof LostLeaseError) {
      console.warn({
        event: "publish_completion_lost_lease",
        eventId: event.id,
      });
      return;
    }

    /*
      Provider may already have succeeded. Do not invent a new event ID.
  
      Leave the lease to expire. The next worker will retry the provider with the same event ID, and the provider will replay its sotred result.
    */
    console.error({
      event: "publish_finalization_failed",
      eventId: event.id,
      error,
    });
  }
}

async function dispatcherLoop(): Promise<void> {
  while (!shutdownController.signal.aborted) {
    if (providerBreaker.state === "open") {
      await sleep(1_000, undefined, {
        signal: shutdownController.signal,
      }).catch(() => {});
      continue;
    }

    try {
      const events = await claimEvents(
        workerId,
        concurrency,
        leaseMilliseconds,
      );

      if (events.length === 0) {
        await sleep(250, undefined, { signal: shutdownController.signal });
        continue;
      }

      /*
        At most four provider operations from this dispatcher are active concurrently
      */
      await Promise.all(events.map(processEvent));
    } catch (error: unknown) {
      if (shutdownController.signal.aborted) break;
      console.error({ event: "dispatcher_iterator_failed", error });
    }

    try {
      await sleep(500, undefined, { signal: shutdownController.signal });
    } catch (error: unknown) {
      break;
    }
  }
}

function requestShutdown(signal: string): void {
  console.log({ event: "dispatcher_shutdown_requested", signal });

  shutdownController.abort();
}

process.once("SIGINT", () => requestShutdown("SIGINT"));

process.once("SIGTERM", () => requestShutdown("SIGTERM"));

try {
  await dispatcherLoop();
} finally {
  await pool.end();
  console.log({ event: "dispatcher_stopped" });
}
