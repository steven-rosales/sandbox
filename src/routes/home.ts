import type { Router } from '../infra/http/router';

export function registerHomeRoutes(router: Router) {
	router.on('GET', '/', () => {
		return new Response('Welcome to the sandbox server!');
	});
}
