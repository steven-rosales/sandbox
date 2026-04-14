import ssePage from "../public/concepts/sse.html";
import { events } from "./concepts/sse/events";
import { insert } from "./concepts/sse/insert";

const port = Number(Bun.env.PORT || 3200);

Bun.serve({
	port,
	idleTimeout: 30,
	routes: {
		"/": () => new Response("Welcome to the sandbox server!"),
		"/concepts/sse": ssePage,
		"/sse": {
			GET: () => events(),
		},
		"/events": {
			GET: () => events(),
		},
		"/insert": (req) => insert(req),
	},
	error(error) {
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "unknown error",
			}),
			{
				status: 500,
				headers: { "content-type": "application/json" },
			},
		);
	},
});

console.log(`Server running at http://localhost:${port}`);
