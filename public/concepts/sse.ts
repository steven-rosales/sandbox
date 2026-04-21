type MessageRow = {
	body: string;
	created_at: string;
};

const list = document.getElementById('list');
const es = new EventSource('/sse');

es.addEventListener('message', (event: MessageEvent<string>) => {
	const row = JSON.parse(event.data) as MessageRow;
	const li = document.createElement('li');
	li.textContent = `${row.body} (${row.created_at})`;
	list?.prepend(li);
	console.log('message', row);
});

es.addEventListener('snapshot', (event: MessageEvent<string>) => {
	const rows = JSON.parse(event.data) as MessageRow[];
	if (!list) return;

	list.innerHTML = '';
	for (const row of rows) {
		const li = document.createElement('li');
		li.textContent = `${row.body} (${row.created_at})`;
		list.appendChild(li);
	}
	console.log('snapshot', rows);
});

es.addEventListener('heartbeat', (event: MessageEvent<string>) => {
	console.log('heartbeat', event.data);
});

es.onerror = (error) => console.log('SSE error', error);
