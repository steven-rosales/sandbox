import { createServer } from 'node:http';
import { toWebRequest, writeWebResponse } from './infra/http/adapter';
import { createApp } from './app';

const port = Number(process.env.PORT || 3200);
const app = createApp();

const server = createServer(async (req, res) => {
	const webRequest = toWebRequest(req, port);
	const webResponse = await app.handle(webRequest);
	await writeWebResponse(res, webResponse);
});

server.keepAliveTimeout = 30_000;
server.listen(port);

console.log(`Server running at http://localhost:${port}`);
