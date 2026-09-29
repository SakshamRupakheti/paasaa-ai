import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['../src/index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['../src/index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['../src/styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['../src/app.js', 'text/javascript; charset=utf-8']],
  ['/favicon.svg', ['../src/favicon.svg', 'image/svg+xml']],
]);

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  const path = new URL(request.url, 'http://localhost').pathname;
  const file = files.get(path);
  if (!file) { response.writeHead(404).end('Not found'); return; }
  try {
    const body = await readFile(new URL(file[0], import.meta.url));
    response.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500).end('Could not load the preview.');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(4173, '127.0.0.1', () => console.log('Paasaa preview: http://127.0.0.1:4173'));
