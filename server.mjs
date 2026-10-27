// Zero-dependency static server for dist/ (Cloud Run). SPA fallback to index.html.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

async function resolveFile(urlPath) {
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '');
  const abs = join(ROOT, rel);
  if (!abs.startsWith(ROOT)) return null;
  try {
    if ((await stat(abs)).isFile()) return abs;
  } catch { /* fall through */ }
  return extname(rel) ? null : join(ROOT, 'index.html');
}

const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost');
    let file;
    try {
      file = await resolveFile(pathname);
    } catch (e) {
      if (e instanceof URIError) {
        res.writeHead(400, { 'content-type': 'text/plain', 'x-content-type-options': 'nosniff' });
        res.end('bad request');
        return;
      }
      throw e;
    }
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain', 'x-content-type-options': 'nosniff' });
      res.end('not found');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'x-content-type-options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('server error');
  }
});

server.listen(Number(process.env.PORT ?? 8080), '0.0.0.0');
