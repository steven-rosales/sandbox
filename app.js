import http from 'node:http';
import fs from 'node:fs';

const server = http.createServer();

server.on('request', (req, res) => {
  const result = fs.readFileSync('./text.txt');
  res.setHeader('Content-Type', 'text/plain');
  res.end(result);
});

server.listen(4000, '127.0.0.1', () => {
  console.log('Server has started on:', server.address());
});