import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const preview = process.argv.includes("--preview");
const publicRoot = path.join(rootDirectory, preview ? "dist" : "public");
const siteRoot = preview ? path.join(rootDirectory, "dist") : rootDirectory;
const port = Number(process.env.PORT || (preview ? 4174 : 4173));

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

async function resolveRequest(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return { file: null, status: 400 };
  }
  if (decoded.includes("\\") || decoded.includes("\0")) return { file: null, status: 400 };

  const relative = decoded.replace(/^\/+/, "");
  if (!preview) {
    if (relative.startsWith("src/")) {
      const file = path.resolve(rootDirectory, relative);
      if (!withinRoot(rootDirectory, file)) return { file: null, status: 403 };
      return { file: await readableFile(file), status: 200 };
    }
    if (relative.startsWith("images/") || relative === "favicon.svg" || relative === "robots.txt" || relative === "sitemap.xml") {
      const file = path.resolve(publicRoot, relative);
      if (!withinRoot(publicRoot, file)) return { file: null, status: 403 };
      return { file: await readableFile(file), status: 200 };
    }
    if (relative && path.extname(relative)) {
      const file = path.resolve(rootDirectory, relative);
      if (!withinRoot(rootDirectory, file)) return { file: null, status: 403 };
      return { file: await readableFile(file), status: 200 };
    }
    return { file: path.join(rootDirectory, "index.html"), status: 200 };
  }

  const requested = path.resolve(siteRoot, relative || "index.html");
  if (!withinRoot(siteRoot, requested)) return { file: null, status: 403 };
  let file = await readableFile(requested);
  if (!file) file = await readableFile(path.join(requested, "index.html"));
  if (file) return { file, status: 200 };
  return { file: await readableFile(path.join(siteRoot, "404.html")), status: 404 };
}

if (preview) {
  try {
    await access(path.join(siteRoot, "index.html"));
  } catch {
    console.error("No dist/index.html found. Run npm run build first.");
    process.exit(1);
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
    return;
  }

  const requestUrl = new URL(request.url || "/", "http://localhost");
  const result = await resolveRequest(requestUrl.pathname);
  if (!result.file) {
    response.writeHead(result.status === 200 ? 404 : result.status, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
    response.end(result.status === 400 ? "Bad request" : "Not found");
    return;
  }

  const type = contentTypes[path.extname(result.file).toLowerCase()] || "application/octet-stream";
  response.writeHead(result.status, {
    "Content-Type": type,
    "Cache-Control": type.startsWith("text/html") ? "no-cache" : "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(result.file).pipe(response);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`${preview ? "AVENOX preview" : "AVENOX development server"} listening on http://0.0.0.0:${port}`);
});
