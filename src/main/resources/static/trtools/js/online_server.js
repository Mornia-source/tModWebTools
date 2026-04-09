const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8787;
const ROOT = __dirname;

/** @type {Set<import('http').ServerResponse>} */
const clients = new Set();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm'
};

function sendCount() {
  const msg = `data: ${JSON.stringify({ count: clients.size })}\n\n`;
  for (const res of clients) {
    try {
      res.write(msg);
    } catch (_) {
      // ignore disconnected clients
    }
  }
}

function isSafePath(absPath) {
  const rel = path.relative(ROOT, absPath);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function writeCacheHeader(res, ext) {
  const isHtml = ext === '.html';
  if (isHtml) {
    res.setHeader('Cache-Control', 'no-cache');
    return;
  }
  res.setHeader('Cache-Control', 'public, max-age=604800');
}

function serveFile(res, absPath) {
  fs.readFile(absPath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not Found');
      return;
    }

    const ext = path.extname(absPath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', type);
    writeCacheHeader(res, ext);
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);

  if (url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
    });

    res.write('retry: 1000\n');
    res.write(`data: ${JSON.stringify({ count: clients.size })}\n\n`);

    clients.add(res);
    sendCount();

    req.on('close', () => {
      clients.delete(res);
      sendCount();
    });
    return;
  }

  if (url.pathname === '/count') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(JSON.stringify({ count: clients.size }));
    return;
  }

  let requestPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const absPath = path.normalize(path.join(ROOT, requestPath));

  if (!isSafePath(absPath)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Forbidden');
    return;
  }

  fs.stat(absPath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      const indexPath = path.join(absPath, 'index.html');
      serveFile(res, indexPath);
      return;
    }
    serveFile(res, absPath);
  });
});

server.listen(PORT, () => {
  console.log(`TRTOOLS server running: http://localhost:${PORT}`);
  console.log('Online count SSE endpoint: /events');
});
