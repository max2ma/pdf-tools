import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const toolRoot = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = dirname(toolRoot);
const port = Number(process.env.PORT || 4888);
const host = process.env.HOST || '0.0.0.0';
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
function resolveFile(pathname) {
  if (pathname === '/' || pathname === '/index.html') return join(toolRoot, 'entry.html');
  if (pathname.startsWith('/node_modules/')) {
    const tail = pathname.slice('/node_modules/'.length);
    const owner = tail.startsWith('pdfjs-dist/') ? 'compress-pdf-tool' : 'merge-pdf-tool';
    return join(projectRoot, owner, 'node_modules', tail);
  }
  const match = pathname.match(/^\/(merge-pdf-tool|rotate-pdf-page-tool|compress-pdf-tool|photo-to-pdf-tool|two-pages-one-pdf-tool)(?:\/(.*))?$/);
  return match ? join(projectRoot, match[1], match[2] || 'index.html') : null;
}
createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const file = resolveFile(pathname);
  if (!file || !file.startsWith(projectRoot)) return res.writeHead(404).end('Not found');
  try {
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    res.writeHead(200, {'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    res.end(await readFile(file));
  } catch (error) { console.error(pathname, file, error.message); res.writeHead(404).end('Not found'); }
}).listen(port, host, () => console.log(`PDF tools: http://max-nas:${port}`));
