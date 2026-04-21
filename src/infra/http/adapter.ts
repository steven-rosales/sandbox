import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import type { IncomingMessage, ServerResponse } from 'node:http';

type NodeRequestInit = RequestInit & { duplex?: 'half' };

/**
 * This lets code written for the Fetch API can handle the request.
 * - takes Node's incoming HTTP request
 * - copies method + URL + headers
 * - converts the Node readable stream with `Readable.toWeb(request) if there is a body
 * - returns a stanadard Web `Request`
 */
export function toWebRequest(req: IncomingMessage, port: number) {
	const origin = `http://${req.headers.host ?? `localhost:${port}`}`;
	const url = new URL(req.url ?? '/', origin);
	const headers = new Headers();

	for (const [name, value] of Object.entries(req.headers)) {
		if (Array.isArray(value)) {
			for (const item of value) headers.append(name, item);
		} else if (typeof value === 'string') {
			headers.set(name, value);
		}
	}

	const method = req.method ?? 'GET';
	if (method === 'GET' || method === 'HEAD')
		return new Request(url, { method, headers });

	const init: NodeRequestInit = {
		method,
		headers,
		body: Readable.toWeb(req) as unknown as BodyInit,
		duplex: 'half',
	};

	return new Request(url, init);
}

/**
 * Lets Node send the response back to the client.
 * - takes a standard Web `Response`
 * - copies status and headers to Node's response
 * - if there is a body, converts the Web stream with Readable.fromWeb(...)
 * - pipes it into Node's `ServerResponse`
 */
export async function writeWebResponse(
	res: ServerResponse,
	webResponse: Response,
) {
	res.statusCode = webResponse.status;
	res.statusMessage = webResponse.statusText;

	webResponse.headers.forEach((value, key) => {
		res.setHeader(key, value);
	});

	if (!webResponse.body) {
		res.end();
		return;
	}

	await new Promise<void>((resolve, reject) => {
		const body = Readable.fromWeb(
			webResponse.body as unknown as ReadableStream,
		);

		body.once('error', reject);
		res.once('close', resolve);
		res.once('finish', resolve);
		body.pipe(res);
	});
}
