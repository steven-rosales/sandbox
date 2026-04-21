import { Router } from './infra/http/router';
import { serveStatic } from './infra/http/static';
import { registerHomeRoutes } from './routes/home';
import { registerSseRoutes } from './routes/sse';
import { registerPubSubRoutes } from './routes/pub-sub';

function jsonError(status: number, error: string) {
	return Response.json({ error }, { status });
}

export function createApp() {
	const router = new Router();

	// `router.on(...)` mutates the router instance
	registerHomeRoutes(router);
	registerSseRoutes(router);
	registerPubSubRoutes(router);

	// `handle()` can use router instance due to closures
	return {
		async handle(req: Request): Promise<Response> {
			const { pathname } = new URL(req.url);

			if (pathname.startsWith('/public/')) return serveStatic(pathname);
 
			try {
				return await router.handle(req);
			} catch (err) {
				return jsonError(
					500,
					err instanceof Error ? err.message : 'unknown error',
				);
			}
		},
	};
}
