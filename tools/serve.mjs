// Tiny static server for app/ on http://localhost:8080 (service workers need http(s), not file://).
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {join, dirname, extname, normalize} from 'node:path';
import {fileURLToPath} from 'node:url';
import {exec} from 'node:child_process';

const app = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');
const port = +(process.env.PORT || 8080);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.pfb': 'application/octet-stream', '.bcmap': 'application/octet-stream',
  // served as an opaque file: tesseract.js gunzips it itself, so no Content-Encoding header
  '.gz': 'application/gzip', '.wasm': 'application/wasm',
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(app, path));
    if (!file.startsWith(app)) { res.writeHead(403).end(); return; }
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    res.writeHead(200, {'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache'});
    res.end(await readFile(file));
  } catch { res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}).end('Không tìm thấy'); }
}).listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}/`;
  console.log(`Thành phố PDF đang chạy tại ${url}  (Ctrl+C để dừng)`);
  if (!process.env.NO_OPEN) exec(process.platform === 'win32' ? `start "" "${url}"` : `xdg-open ${url}`);
});
