import { readFile } from 'node:fs/promises';

const publicDirPath = new URL('../../public', import.meta.url);

const contentTypes = new Map([
	['.css', 'text/css; charset=utf-8'],
	['.html', 'text/html; charset=utf-8'],
	['.js', 'text/javascript; charset=utf-8'],
	['.json', 'application/json; charset=utf-8'],
	['.svg', 'image/svg+xml'],
	['.txt', 'text/plain; charset=utf-8'],
]);

function getContentType(pathname: string) {
	for (const [extension, contentType] of contentTypes) {
		if (pathname.endsWith(extension)) return contentType;
	}

	return 'application/octet-stream';
}

export async function serveStatic(pathname: string) {
	const relativePath = pathname.replace(/^\/public\//, '');
	const fileUrl = new URL(relativePath, publicDirPath);

	if (!fileUrl.href.startsWith(publicDirPath.href))
		return Response.json({ error: 'invalid path' }, { status: 403 });

	try {
		const file = await readFile(fileUrl);
		return new Response(file, {
			headers: { 'content-type': getContentType(fileUrl.pathname) },
		});
	} catch (err) {
		if (
			err &&
			typeof err === 'object' &&
			'code' in err &&
			err.code === 'ENOENT'
		)
			return new Response('Not found', { status: 404 });

		throw err;
	}
}
