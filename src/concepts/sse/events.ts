import { sql } from "../../db";
import { sseFrame } from "./frame";

export type MessageRow = {
	id: string;
	body: string;
	created_at: string;
};

export function events() {
	const encoder = new TextEncoder();
	let cleanup: (() => void) | undefined;

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			let closed = false;
			let pollTimer: ReturnType<typeof setInterval> | undefined;
			let keepAliveTimer: ReturnType<typeof setInterval> | undefined;

			const stop = () => {
				if (closed) return;
				closed = true;
				if (pollTimer) clearInterval(pollTimer);
				if (keepAliveTimer) clearInterval(keepAliveTimer);
			};

			const write = (chunk: string) => {
				if (closed) return;

				try {
					controller.enqueue(encoder.encode(chunk));
				} catch {
					stop();
				}
			};

			const send = (data: unknown, event?: string, id?: string) =>
				write(sseFrame(data, event, id));

			try {
				const rows = await sql<MessageRow[]>`
          select id, body, created_at::text
          from messages
          order by id desc
          limit 20
        `;

				send(rows, "snapshot");
			} catch (err) {
				send(
					{ error: err instanceof Error ? err.message : "unknown error" },
					"error",
				);
			}

			pollTimer = setInterval(async () => {
				try {
					const latest = await sql<MessageRow[]>`
            select id, body, created_at::text
            from messages
            order by id desc
            limit 1
          `;

					if (latest.length > 0) send(latest[0], "message", latest[0]?.id);
				} catch (err) {
					send(
						{ error: err instanceof Error ? err.message : "poll failed" },
						"error",
					);
				}
			}, 5000);

			keepAliveTimer = setInterval(() => {
				write(`: keep-alive\n\n`);
			}, 5000);

			cleanup = stop;
		},

		cancel() {
			cleanup?.();
		},
	});

	return new Response(stream, {
		headers: {
			"content-type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-cache, no-transform",
			connection: "keep-alive",
			"x-accel-buffering": "no",
		},
	});
}
