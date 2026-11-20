// Convierte los originales de public/images/project/ a WebP (max 1600px, q82).
// Elimina los originales JPG/PNG tras convertirlos.
// Uso: node scripts/convert-originals-webp.mjs
import { readdir, stat, rm, access } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const srcBase = join(root, "public", "images", "project");

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jpe?g|png)$/i.test(entry.name)) yield full;
  }
}

let count = 0;
let beforeBytes = 0;
let afterBytes = 0;

for await (const src of walk(srcBase)) {
  const out = src.replace(/\.(jpe?g|png)$/i, ".webp");
  const outExists = await access(out).then(() => true, () => false);
  if (!outExists) {
    const srcBytes = (await stat(src)).size;
    const image = sharp(src).rotate();
    const meta = await image.metadata();
    const scale = Math.min(1, 1600 / Math.max(meta.width, meta.height));
    const pipeline = scale < 1
      ? image.resize(Math.round(meta.width * scale), Math.round(meta.height * scale))
      : image;
    const info = await pipeline.webp({ quality: 82 }).toFile(out);
    beforeBytes += srcBytes;
    afterBytes += info.size;
    count++;
    console.log(`${out.replace(srcBase, "")} ${meta.width}x${meta.height} ${(srcBytes / 1024).toFixed(0)} KB -> ${(info.size / 1024).toFixed(0)} KB`);
  } else {
    console.log(`ya convertido, elimina original: ${src.replace(srcBase, "")}`);
  }
  // elimina el original (reintenta: antivirus/indexadores bloquean archivos)
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await rm(src);
      break;
    } catch (err) {
      if (err.code === "EBUSY" && attempt < 5) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      } else {
        console.warn(`AVISO: no se pudo eliminar ${src}: ${err.code ?? err.message}`);
        break;
      }
    }
  }
}

console.log(`\n${count} archivos: ${(beforeBytes / 1048576).toFixed(1)} MB -> ${(afterBytes / 1048576).toFixed(1)} MB`);
