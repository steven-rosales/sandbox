export type Handler = (
	request: Request,
	params: Record<string, string>,
) => Response | Promise<Response>;

type Route = {
	method: string;
	match: (pathname: string) => Record<string, string> | null;
	handler: Handler;
};

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePathname(pathname: string) {
	if (pathname === '') return '/';
	if (pathname.startsWith('/')) return pathname;
	return `/${pathname}`;
}

function compilePathname(pathname: string) {
	const params: string[] = [];
	const pattern = normalizePathname(pathname)
		.split('/')
		.map((segment, index) => {
			if (index === 0) return '';

			if (segment === '*') return '.*';

			if (segment.startsWith(':')) {
				const paramName = segment.slice(1);

				if (/^[A-Za-z0-9_]+$/.test(paramName)) {
					params.push(paramName);
					return '([^/]+)';
				}
			}

			return escapeRegExp(segment);
		})
		.join('/');
	const matcher = new RegExp(`^${pattern}$`);

	/**
	 * A custom matcher with regex
	 */
	return (pathnameToMatch: string) => {
		const match = matcher.exec(normalizePathname(pathnameToMatch));

		if (!match) return null;

		const groups: Record<string, string> = {};

		for (const [index, paramName] of params.entries()) {
			groups[paramName] = decodeURIComponent(match[index + 1] ?? '');
		}

		return groups;
	};
}

/**
 * Router that handles requests.
 * - `on` mounts the route with the method and handler function (which is the action, usually the controller)
 * - `handle` handles the request coming in and check for the `on` mounted
 */
export class Router {
	private routes: Route[] = [];

	on(method: string, pathname: string, handler: Handler) {
		this.routes.push({
			method: method.toUpperCase(),
			match: compilePathname(pathname),
			handler,
		});
	}

	async handle(req: Request): Promise<Response> {
		const url = new URL(req.url);
		const method = req.method.toUpperCase();

		for (const route of this.routes) {
			if (route.method !== method) continue;

			const params = route.match(url.pathname);

			if (!params) continue;

			return route.handler(req, params);
		}

		return new Response('Not found', { status: 404 });
	}
}
