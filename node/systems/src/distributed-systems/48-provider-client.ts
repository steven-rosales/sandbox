import { z } from "zod";
import { config } from "./40-config.js";
import { OrderCreatedV1Schema } from "./43-domain.js";
import type { ClaimedEvent } from "./46-outbox.js";

const ProviderResponseSchema = z.object({
  providerReference: z.string(),
  accepted: z.literal(true),
});

export type ProviderResponse = z.infer<typeof ProviderResponseSchema>;

export class DependencyError extends Error {
  public constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "DependencyError";
  }
}

export async function submitToProvider(
  claimedEvent: ClaimedEvent,
  shutdownSignal: AbortSignal,
  simulateAfterCommitFailure = false,
): Promise<ProviderResponse> {
  const event = OrderCreatedV1Schema.parse(claimedEvent.payload);

  const timeoutSignal = AbortSignal.timeout(1_500);

  const signal = AbortSignal.any([shutdownSignal, timeoutSignal]);

  try {
    const response = await fetch(`${config.PROVIDER_URL}/operations`, {
      method: "POST",
      headers: {
        "content-type": "application/json",

        // The event ID remains stable across every retry
        "idempotency-key": event.eventId,

        ...(simulateAfterCommitFailure
          ? { "x-fail-after-commit": "true" }
          : {}),
      },

      body: JSON.stringify({
        orderId: event.aggregateId,
        tenantId: event.tenantId,
        amountCents: event.data.amountCents,
      }),

      signal,
    });

    if (!response.ok) {
      const details = await response.text();

      const retryable =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;

      throw new DependencyError(
        `Provider returned ${response.status}: ` + details,
        retryable,
        response.status,
      );
    }

    return ProviderResponseSchema.parse(await response.json());
  } catch (error: unknown) {
    if (error instanceof DependencyError) throw error;

    if (timeoutSignal.aborted)
      throw new DependencyError("Provider request timed out", true, undefined, {
        cause: error,
      });

    throw new DependencyError(
      "Provider network request failed",
      true,
      undefined,
      { cause: error },
    );
  }
}
