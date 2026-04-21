export function sseFrame(data: unknown, event?: string, id?: string) {
	let out = '';

	if (event) out += `event: ${event}\n`;
	if (id) out += `id: ${id}\n`;

	const payload = JSON.stringify(data);
	for (const line of payload.split('\n')) {
		out += `data: ${line}\n`;
	}

	out += '\n';
	return out;
}
