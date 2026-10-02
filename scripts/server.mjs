import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const preview = process.argv.includes("--preview");
const publicRoot = path.join(rootDirectory, "public");
const sourceRoot = path.join(rootDirectory, "src");
const distRoot = path.join(rootDirectory, "dist");
const port = Number(process.env.PORT || (preview ? 4174 : 4173));
// Binds to all interfaces by default so container/cloud previews work. Set HOST=127.0.0.1
// to keep the local server reachable only from this machine.
const host = process.env.HOST || "0.0.0.0";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

// The production security headers live in vercel.json (single source of truth). The local
// servers send the same headers so the Content-Security-Policy is exercised before deployment.
async function loadSecurityHeaders() {
  try {
    const config = JSON.parse(await readFile(path.join(rootDirectory, "vercel.json"), "utf8"));
    const rule = (config.headers || []).find((item) => item.source === "/(.*)");
    const headers = Object.fromEntries((rule?.headers || []).map(({ key, value }) => [key, value]));
    // The local servers speak plain HTTP, so "upgrade-insecure-requests" would break asset loading here.
    if (headers["Content-Security-Policy"]) {
      headers["Content-Security-Policy"] = headers["Content-Security-Policy"].replace(/;?\s*upgrade-insecure-requests/, "");
    }
    return headers;
  } catch {
    return { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" };
  }
}
const securityHeaders = await loadSecurityHeaders();

async function readableFile(filePath) {
  try {
    const fileInfo = await stat(filePath);
    return fileInfo.isFile() ? filePath : null;
  } catch {
    return null;
  }
}

function withinRoot(root, candidate) {
  const resolved = path.resolve(candidate);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`);
}

// Resolve a request path to a file under one explicit root. Anything outside that root, any
// dotfile segment and anything that is not a regular file is refused.
async function fileUnder(root, relative) {
  const candidate = path.resolve(root, relative);
  if (!withinRoot(root, candidate)) return null;
  return readableFile(candidate);
}

async function resolveRequest(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return { file: null, status: 400 };
  }
  if (decoded.includes("\\") || decoded.includes("\0")) return { file: null, status: 400 };

  const relative = decoded.replace(/^\/+/, "");
  const segments = relative.split("/").filter(Boolean);
  if (segments.some((segment) => segment === ".." || segment.startsWith("."))) return { file: null, status: 404 };

  if (preview) {
    // Mirror static hosting: only files that exist inside dist/ are reachable.
    const requested = relative || "index.html";
    const file = (await fileUnder(distRoot, requested)) || (await fileUnder(distRoot, path.join(requested, "index.html")));
    if (file) return { file, status: 200 };
    return { file: await readableFile(path.join(distRoot, "404.html")), status: 404 };
  }

  // Development: /src/* comes from src/, everything else from public/. No other repository
  // file (package.json, scripts, README, env files, .git) is ever served.
  if (relative.startsWith("src/")) {
    return { file: await fileUnder(sourceRoot, relative.slice(4)), status: 200 };
  }
  if (relative && path.extname(relative)) {
    return { file: await fileUnder(publicRoot, relative), status: 200 };
  }
  return { file: path.join(rootDirectory, "index.html"), status: 200 };
}

if (preview) {
  try {
    await access(path.join(distRoot, "index.html"));
  } catch {
    console.error("No dist/index.html found. Run npm run build first.");
    process.exit(1);
  }
}

function sendText(response, status, message, extra = {}) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...securityHeaders, ...extra });
  response.end(message);
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendText(response, 405, "Method not allowed", { Allow: "GET, HEAD" });
      return;
    }

    let requestUrl;
    try {
      requestUrl = new URL(request.url || "/", "http://localhost");
    } catch {
      sendText(response, 400, "Bad request");
      return;
    }

    const result = await resolveRequest(requestUrl.pathname);
    if (!result.file) {
      sendText(response, result.status === 200 ? 404 : result.status, result.status === 400 ? "Bad request" : "Not found");
      return;
    }

    const type = contentTypes[path.extname(result.file).toLowerCase()] || "application/octet-stream";
    response.writeHead(result.status, {
      "Content-Type": type,
      "Cache-Control": type.startsWith("text/html") ? "no-cache" : "public, max-age=3600",
      ...securityHeaders,
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    const stream = createReadStream(result.file);
    stream.on("error", () => response.destroy());
    stream.pipe(response);
  } catch {
    // Never expose stack traces or filesystem paths to the client.
    if (!response.headersSent) sendText(response, 500, "Server error");
    else response.destroy();
  }
});

server.on("clientError", (_error, socket) => {
  if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
});

server.listen(port, host, () => {
  console.log(`${preview ? "AVENOX preview" : "AVENOX development server"} listening on http://${host}:${port}`);
});
