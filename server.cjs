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
// Nunca bindear a IPs publicas: en hosting compartido colisionan con otras
// apps. Solo se aceptan loopback o 0.0.0.0; cualquier otro HOST se ignora.
const RAW_HOST = process.env.HOST || "";
const IS_SAFE_HOST = /^(127\.|localhost$|0\.0\.0\.0$|::1$)/.test(RAW_HOST);
const HOST = IS_SAFE_HOST ? RAW_HOST : "127.0.0.1";

// Host canonico: todo trafico externo deriva a https://www.travelheight.cl
// (igual que el .htaccess para el modo estatico). Detras de LiteSpeed/Passenger
// el esquema real llega en X-Forwarded-Proto.
const CANONICAL_HOST = "www.travelheight.cl";
const IS_LOCAL = /^(localhost|0\.0\.0\.0|(?:\d{1,3}\.){3}\d{1,3}|\[::1\]|::1)(:\d+)?$/i;

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
  // Redirect canonico (solo trafico externo; el acceso local nunca redirige)
  const reqHost = String(req.headers.host || "");
  if (!IS_LOCAL.test(reqHost)) {
    const proto = String(req.headers["x-forwarded-proto"] || "http")
      .split(",")[0]
      .trim();
    const bareHost = reqHost.split(":")[0].toLowerCase();
    if (proto !== "https" || bareHost !== CANONICAL_HOST) {
      res.writeHead(301, {
        Location: `https://${CANONICAL_HOST}${req.url}`,
        "Content-Type": "text/plain; charset=utf-8",
      });
      return res.end();
    }
  }

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
        // HSTS: fuerza HTTPS a nivel de navegador (solo los primeros 10 días en
        // modo "preload-no"; el canónico ya es https://www, así que es seguro).
        "Strict-Transport-Security":
          "max-age=31536000; includeSubDomains",
        // Permissions-Policy: desactiva APIs del navegador que el sitio no usa.
        "Permissions-Policy":
          "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        // CSP conservador: permite scripts/estilos inline para no romper nada
        // con Astro (unsafe-inline). Fonts externos de Google, resto self.
        "Content-Security-Policy":
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self'; " +
          "frame-ancestors 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self'",
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

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`[server] El puerto ${PORT} ya esta en uso en ${HOST}.`);
    console.error("[server] Si Passenger ya esta sirviendo esta app (cPanel), NO la inicies manualmente:");
    console.error("[server]   - Usa Restart en el panel, o touch tmp/restart.txt");
    console.error("[server]   - Para pruebas manuales usa otro puerto: PORT=3100 node server.cjs");
    process.exit(1);
  }
  if (err && err.code === "EACCES") {
    console.error(`[server] Sin permisos para escuchar en ${HOST}:${PORT} (prueba un puerto > 1024).`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  console.log(`Travel Height sitio servido desde ${DIST} en http://${HOST}:${PORT}`);
});
