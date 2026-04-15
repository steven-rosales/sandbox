/// <reference lib="dom" />

const list = document.getElementById("list");
const es = new EventSource("/sse");

es.addEventListener("message", (e: MessageEvent<string>) => {
	const row = JSON.parse(e.data) as { body: string; created_at: string };
	const li = document.createElement("li");
	li.textContent = `${row.body} (${row.created_at})`;
	list?.prepend(li);
	console.log("message", row);
});

es.addEventListener("snapshot", (e: MessageEvent<string>) => {
	const rows = JSON.parse(e.data);
	if (!list) return;

	list.innerHTML = "";
	for (const row of rows) {
		const li = document.createElement("li");
		li.textContent = `${row.body} (${row.created_at})`;
		list.appendChild(li);
	}
	console.log("snapshot", rows);
});

es.addEventListener("heartbeat", (e: MessageEvent<string>) => {
	console.log("heartbeat", e.data);
});

es.onerror = (err) => console.log("SSE error", err);
