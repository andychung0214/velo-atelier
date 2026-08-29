import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

export function resolveStaticPath(root, requestPath) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath.split('?')[0]);
  } catch {
    return null;
  }

  const normalizedRequest = decodedPath === '/' ? '/index.html' : decodedPath;
  const segments = normalizedRequest.split(/[\\/]+/).filter(Boolean);
  if (segments.some((segment) => segment.startsWith('.'))) return null;

  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, normalizedRequest.replace(/^[/\\]+/, ''));
  const isInsideRoot = resolvedPath === resolvedRoot
    || resolvedPath.startsWith(`${resolvedRoot}${path.sep}`);
  return isInsideRoot ? resolvedPath : null;
}

function sendText(response, status, message) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(message);
}

export function createStaticServer({ root = projectRoot } = {}) {
  return http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      sendText(response, 405, 'Method Not Allowed');
      return;
    }

    const filePath = resolveStaticPath(root, request.url || '/');
    if (!filePath) {
      sendText(response, 404, 'Not Found');
      return;
    }

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        sendText(response, 404, 'Not Found');
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        'Content-Type': MIME_TYPES.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream',
        'Content-Length': body.byteLength,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      sendText(response, error?.code === 'ENOENT' ? 404 : 500, error?.code === 'ENOENT' ? 'Not Found' : 'Server Error');
    }
  });
}

function readOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  const host = readOption('--host', '127.0.0.1');
  const port = Number.parseInt(readOption('--port', '4173'), 10);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('連接埠必須是 0 至 65535 的整數。');
  }

  const server = createStaticServer();
  server.listen(port, host, () => {
    const address = server.address();
    const activePort = typeof address === 'object' && address ? address.port : port;
    process.stdout.write(`Velo Atelier：http://${host}:${activePort}\n`);
  });
}
