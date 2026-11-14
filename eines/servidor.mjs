/* Servidor local per provar l'aplicació:  node eines/servidor.mjs  ->  http://localhost:5173 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +process.env.PORT || 5173;
const TIPUS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ARREL, p);
  if (!f.startsWith(ARREL) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('No trobat'); return; }
  res.writeHead(200, { 'Content-Type': TIPUS[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log(`Boletus Finder a http://localhost:${PORT}`));
