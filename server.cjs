// Servidor de produccion para cPanel (Passenger).
// Sirve el contenido estatico generado por Astro en ./dist
// Cero dependencias externas: solo modulos nativos de Node.
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const DIST = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

// Tipos de texto que se comprimen con gzip si el cliente lo acepta.
const COMPRESSIBLE = new Set([
  ".html", ".css", ".js", ".mjs", ".json", ".svg", ".txt", ".xml", ".webmanifest",
]);

function send404(res) {
  const file404 = path.join(DIST, "404.html");
  fs.readFile(file404, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 - Pagina no encontrada");
      return;
    }
    res.writeHead(404, { "Content-Type": MIME[".html"], "Cache-Control": "no-cache" });
    res.end(data);
  });
}

function resolveFile(urlPath, callback) {
  // Decodifica y limpia la ruta para evitar path traversal
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return callback(null);
  }
  const safe = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const absolute = path.join(DIST, safe);
  if (!absolute.startsWith(DIST)) return callback(null);

  fs.stat(absolute, (err, stat) => {
    if (!err && stat.isDirectory()) {
      // Directorio -> index.html (URLs limpias de Astro)
      callback(path.join(absolute, "index.html"));
    } else if (!err) {
      callback(absolute);
    } else {
      callback(null);
    }
  });
}

const server = http.createServer((req, res) => {
  // Solo GET/HEAD
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }

  resolveFile(req.url, (file) => {
    if (!file) return send404(res);

    fs.readFile(file, (err, data) => {
      if (err) return send404(res);

      const ext = path.extname(file).toLowerCase();
      const headers = {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      };

      // Assets con hash en /_astro/: cache inmutable. HTML: siempre revalidar.
      if (file.includes(`${path.sep}_astro${path.sep}`)) {
        headers["Cache-Control"] = "public, max-age=31536000, immutable";
      } else if (ext === ".html") {
        headers["Cache-Control"] = "no-cache";
      } else {
        headers["Cache-Control"] = "public, max-age=3600";
      }

      const acceptGzip = /gzip/.test(String(req.headers["accept-encoding"] || ""));
      if (acceptGzip && COMPRESSIBLE.has(ext) && data.length > 1024) {
        headers["Content-Encoding"] = "gzip";
        headers["Vary"] = "Accept-Encoding";
        res.writeHead(200, headers);
        return req.method === "HEAD" ? res.end() : res.end(zlib.gzipSync(data));
      }

      headers["Content-Length"] = data.length;
      res.writeHead(200, headers);
      req.method === "HEAD" ? res.end() : res.end(data);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Travel Height sitio servido desde ${DIST} en http://${HOST}:${PORT}`);
});
