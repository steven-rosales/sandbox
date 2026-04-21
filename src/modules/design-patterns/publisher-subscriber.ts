import { sql } from '../../infra/database/db';

type DomainEvents = {
	'order:created': { orderId: string; userId: number; amount: number };
	'user:deleted': { userId: number };
};

type OrderRow = {
	id: string;
	user_id: number;
	amount: string;
	created_at: string;
};

const badRequest = (message: string) =>
	Response.json({ error: message }, { status: 400 });

const createTypedBus = () => {
	const target = new EventTarget();

	return {
		subscribe: <K extends keyof DomainEvents>(
			eventName: K,
			handler: (payload: DomainEvents[K]) => Promise<void> | void,
		) => {
			target.addEventListener(eventName, ((
				event: CustomEvent<DomainEvents[K]>,
			) => {
				Promise.resolve(handler(event.detail)).catch((err) =>
					console.error(`[Bus Error] ${eventName}:`, err),
				);
			}) as EventListener);
		},

		publish: <K extends keyof DomainEvents>(
			eventName: K,
			payload: DomainEvents[K],
		) => target.dispatchEvent(new CustomEvent(eventName, { detail: payload })),
	};
};

const bus = createTypedBus();

bus.subscribe('order:created', async (payload) => {
	console.log(`[Notification Service] Sending SMS to user ${payload.userId}`);
});

bus.subscribe('order:created', async (payload) => {
	console.log(`[Analytics Service] Logging revenue: $${payload.amount}`);
});

export const processNewOrder = async (req: Request) => {
	const url = new URL(req.url);
	const userIdParam = url.searchParams.get('userId');
	const amountParam = url.searchParams.get('amount');

	if (!userIdParam) return badRequest('userId is required');
	if (!amountParam) return badRequest('amount is required');

	const userId = Number.parseInt(userIdParam, 10);
	if (!Number.isInteger(userId) || userId < 1) {
		return badRequest('userId must be a positive integer');
	}

	const amount = Number(amountParam);
	if (!Number.isFinite(amount) || amount < 0) {
		return badRequest('amount must be a non-negative number');
	}

	const [user] = await sql<{ id: number }[]>`
    SELECT id
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

	if (!user) {
		return Response.json(
			{ error: `user ${userId} not found` },
			{ status: 404 },
		);
	}

	const [order] = await sql<OrderRow[]>`
    INSERT INTO orders (user_id, amount)
    VALUES (${userId}, ${amount})
    RETURNING id, user_id, amount::text, created_at::text
  `;

	if (!order) {
		throw new Error('order insert did not return a row');
	}

	bus.publish('order:created', {
		orderId: order.id,
		userId,
		amount,
	});

	return Response.json(order, {
		status: 201,
		headers: {
			'Cache-Control': 'no-cache, no-transform',
			'x-accel-buffering': 'no',
		},
	});
};
