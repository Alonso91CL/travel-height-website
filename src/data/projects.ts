import type { ImageMetadata } from "astro";

/**
 * Datos de proyectos reales de Travel Height SpA.
 * Las fotos viven en src/assets/projects/<slug>/ y se optimizan con
 * scripts/optimize-project-photos.ps1 (origen: public/images/project/).
 * Campos opcionales (comuna, tipo, año) listos para agregar cuando el
 * cliente confirme la información.
 */

export interface Project {
  /** Identificador interno, coincide con la carpeta de assets. */
  slug: string;
  /** Nombre legible del proyecto (nunca el nombre crudo de la carpeta). */
  name: string;
  /** Número de orden interno de la empresa, p. ej. "1728". */
  ref?: string;
  /** Comuna o ciudad. Pendiente de confirmar. */
  comuna?: string;
  /** Tipo de trabajo, p. ej. "Instalación" o "Mantención". Pendiente de confirmar. */
  tipo?: string;
  images: ImageMetadata[];
}

const modules = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/projects/*/*.jpg",
  { eager: true },
);

function imagesFor(slug: string): ImageMetadata[] {
  return Object.entries(modules)
    .filter(([path]) => path.includes(`/projects/${slug}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, mod]) => mod.default);
}

// Orden pensado para el grid bento: portadas grandes con las fotos de
// mayor resolución primero; proyectos con fotos de baja resolución al final.
export const projects: Project[] = [
  {
    slug: "venecia",
    name: "Edificio Venecia",
    images: imagesFor("venecia"),
  },
  {
    slug: "aurora",
    name: "Edificio Aurora",
    comuna: "Antofagasta",
    images: imagesFor("aurora"),
  },
  {
    slug: "don-claudio",
    name: "Edificio Don Claudio",
    ref: "1728",
    images: imagesFor("don-claudio"),
  },
  {
    slug: "san-nicolas",
    name: "Edificio San Nicolás",
    ref: "1346",
    images: imagesFor("san-nicolas"),
  },
  {
    slug: "tempo-trinidad",
    name: "Tempo Trinidad",
    ref: "1533",
    images: imagesFor("tempo-trinidad"),
  },
  {
    slug: "lo-ovalle",
    name: "Edificio Lo Ovalle",
    ref: "0926",
    images: imagesFor("lo-ovalle"),
  },
  {
    slug: "greco-1-y2",
    name: "Exequiel Fernández — Greco 1 y 2",
    images: imagesFor("greco-1-y2"),
  },
  {
    slug: "corona-maipu",
    name: "Condominio Corona",
    comuna: "Maipú",
    images: imagesFor("corona-maipu"),
  },
  {
    slug: "gran-pacifico-2",
    name: "Gran Pacífico 2",
    comuna: "Antofagasta",
    images: imagesFor("gran-pacifico-2"),
  },
];
