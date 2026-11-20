// Optimiza las fotos curadas de proyectos: public/images/project/ (WebP)
// -> src/assets/projects/<slug>/01..05.webp (max 1600px, q82).
// 01 = portada. Re-ejecutable: sobrescribe la salida.
// Uso: node scripts/optimize-project-photos.mjs
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const srcBase = join(root, "public", "images", "project");
const destBase = join(root, "src", "assets", "projects");

// slug = nombre legible en src/data/projects.ts | carpeta origen | archivos curados (01 = portada)
const projects = [
  { slug: "greco-1-y2", folder: "EXEQUIEL FERMANDEZ (GRECO 1 Y2)", files: ["IMG_3254.webp", "10c6c307-d3a2-4e79-90a6-14fa0e1b3650.webp", "IMG_3256.webp", "IMG_3265.webp", "IMG_3248.webp"] },
  { slug: "aurora", folder: "FOTOS AURORA ANTOFAGASTA", files: ["PHOTO-2026-08-20-14-36-23.webp", "PHOTO-2026-08-18-13-30-23_1.webp", "IMG_6986.webp", "IMG_6981.webp", "PHOTO-2026-08-20-14-36-23_2.webp"] },
  { slug: "corona-maipu", folder: "FOTOS CORONA MAIPU", files: ["IMG_8376.webp", "IMG_8449.webp", "IMG_8399.webp", "IMG_8390.webp", "IMG_8423.webp"] },
  { slug: "don-claudio", folder: "FOTOS DON CLAUDIO # 1728", files: ["a8a5c978-3c31-491c-af93-48d25f274610.webp", "c6d8d58b-7723-4463-a84d-9fca9674d945.webp", "IMG_2816.webp", "IMG_2849.webp", "IMG_2864.webp"] },
  { slug: "gran-pacifico-2", folder: "FOTOS GRAN PACIFICO 2 ANTOFAGASTA", files: ["IMG_1429.webp", "IMG_1425.webp", "IMG_1433.webp", "IMG_1474.webp", "IMG_1436.webp"] },
  { slug: "lo-ovalle", folder: "FOTOS LO OVALLE # 0926", files: ["1000185733.webp", "IMG_2415.webp", "IMG_2454.webp", "IMG_2480.webp", "IMG_2432.webp"] },
  { slug: "san-nicolas", folder: "FOTOS SAN NICOLAS # 1346", files: ["PHOTO-2025-07-29-10-34-16.webp", "PHOTO-2025-09-12-16-13-54.webp", "PHOTO-2025-07-29-10-34-24.webp", "IMG_3958.webp", "PHOTO-2025-07-29-10-34-20.webp"] },
  { slug: "tempo-trinidad", folder: "FOTOS TEMPO TRINIDAD # 1533", files: ["PHOTO-2026-04-23-11-27-33.webp", "IMG_6896.webp", "IMG_6871.webp", "IMG_6897.webp", "IMG_6905.webp"] },
  { slug: "venecia", folder: "FOTOS VENECIA", files: ["IMG_9128.webp", "IMG_9123.webp", "IMG_9120.webp", "IMG_9174.webp", "IMG_9236.webp"] },
];

for (const project of projects) {
  const destDir = join(destBase, project.slug);
  await mkdir(destDir, { recursive: true });
  let n = 0;
  for (const file of project.files) {
    n++;
    const src = join(srcBase, project.folder, file);
    const out = join(destDir, `${String(n).padStart(2, "0")}.webp`);
    const meta = await sharp(src).metadata();
    const scale = Math.min(1, 1600 / Math.max(meta.width, meta.height));
    const pipeline = scale < 1
      ? sharp(src).resize(Math.round(meta.width * scale), Math.round(meta.height * scale))
      : sharp(src);
    const info = await pipeline.webp({ quality: 82 }).toFile(out);
    console.log(`${project.slug}/${String(n).padStart(2, "0")}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`);
  }
}
