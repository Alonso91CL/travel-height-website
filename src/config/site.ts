export const siteConfig = {
  name: "Travel Height SpA",
  shortName: "Travel Height",
  legalName: "Travel Height SpA",
  url: "https://www.travelheight.cl",
  description:
    "Expertos en ingeniería de elevación vertical con más de 30 años de experiencia. Instalación, mantenimiento y modernización de elevadores con seguridad certificada y servicio 24/7 en Chile.",
  locale: "es_CL",
  ogImage: "/images/og-travel-height.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  minvuRegistry: "387",
  areaServed: ["Región Metropolitana", "Chile"],
  knowsAbout: [
    "Ascensores",
    "Escaleras mecánicas",
    "Instalación de ascensores",
    "Mantenimiento de elevadores",
    "Modernización de ascensores",
    "Emergencias de ascensores",
  ],
  contact: {
    address: "Av. Apoquindo 4800, Las Condes, Santiago",
    addressStructured: {
      streetAddress: "Av. Apoquindo 4800",
      addressLocality: "Las Condes",
      addressRegion: "Región Metropolitana",
      addressCountry: "CL",
    },
    phone: "+56 9 8284 8573",
    email: "contacto@travelheight.cl",
    whatsapp: "56982848573",
  },
};

export const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/servicios/", label: "Servicios" },
  { href: "/emergencias/", label: "Emergencias" },
  { href: "/proyectos/", label: "Proyectos" },
  { href: "/nosotros/", label: "Nosotros" },
  { href: "/cotizacion/", label: "Contacto" },
];

export function whatsappUrl(message: string): string {
  return `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
