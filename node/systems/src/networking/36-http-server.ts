import http from "node:http";

const server = http.createServer(async (req, res) => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks);

  console.log({
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: body.toString("utf8"),
  });

  res.writeHead(200, { "content-type": "application/json" });

  res.end(JSON.stringify({ ok: true }));
});

server.listen(4003, () => {
  console.log("HTTP listening to 4003");
});
