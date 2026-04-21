import { readFile } from 'node:fs/promises';
import { events } from '../modules/systems/sse/events';
import { insert } from '../modules/systems/sse/insert';
import type { Router } from '../infra/http/router';

const ssePagePath = new URL('../../public/concepts/sse.html', import.meta.url);

export function registerSseRoutes(router: Router) {
	router.on('GET', '/public/sse', async () => {
		const html = await readFile(ssePagePath, 'utf8');
		return new Response(html, {
			headers: { 'content-type': 'text/html; charset=utf-8' },
		});
	});

	router.on('GET', '/sse', () => events());
	router.on('GET', '/sse/events', () => events());
	router.on('POST', '/sse/insert', (req) => insert(req));
}
