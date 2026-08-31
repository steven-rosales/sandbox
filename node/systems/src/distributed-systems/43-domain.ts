import { z } from "zod";

export const CreateOrderInputSchema = z.object({
  tenantId: z.uuid(),
  customerId: z.uuid(),

  amountCents: z.number().int().positive().max(10_000_000),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export type CreateOrderBody = { orderId: string; status: "accepted" };

export const OrderCreatedV1Schema = z.object({
  eventId: z.uuid(),
  eventType: z.literal("order.created"),
  eventVersion: z.literal(1),
  occurredAt: z.iso.datetime(),
  tenantId: z.uuid(),
  aggregateId: z.uuid(),
  data: z.object({
    customerId: z.uuid(),
    amountCents: z.number().int().positive(),
  }),
});

export type OrderCreatedV1 = z.infer<typeof OrderCreatedV1Schema>;
