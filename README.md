# Travel Height Elevadores — Sitio Web

Sitio corporativo de **Travel Height SPA**, empresa de ingeniería vertical en Chile: instalación, mantenimiento, modernización y emergencias 24/7.

Construido como **sitio 100% estático** con [Astro](https://astro.build) + [Tailwind CSS 4](https://tailwindcss.com), listo para desplegarse en **cPanel (Node.js App / Passenger)** con despliegue automatizado vía Git.

## Stack

- Astro 6 (SSG, salida estática en `dist/`)
- Tailwind CSS 4 (plugin Vite) + tokens de diseño propios en `src/styles/global.css`
- Tipografía Manrope + Material Symbols
- Servidor de producción propio sin dependencias (`server.cjs`)
- SEO: meta tags, Open Graph, canonical, sitemap y robots.txt

## Estructura

```text
/
├── public/              # assets estáticos (imágenes, favicon, robots.txt)
├── src/
│   ├── components/      # Hero, Nav, MobileMenu, Footer, FAQ, StatsBar, StepCard
│   ├── config/site.ts   # configuración central: contacto, WhatsApp, navegación
│   ├── layouts/BaseLayout.astro   # layout base con SEO y scripts globales
│   ├── pages/           # index, servicios, emergencias, proyectos, nosotros, cotizacion, 404
│   └── styles/global.css
├── server.cjs           # servidor estático para Passenger/cPanel
└── .cpanel.yml          # tareas de despliegue automático
```

## Comandos

| Command         | Action                                        |
| :-------------- | :-------------------------------------------- |
| `pnpm install`  | Instala dependencias                          |
| `pnpm dev`      | Servidor de desarrollo en `localhost:4321`    |
| `pnpm build`    | Build de producción a `./dist/`               |
| `pnpm check`    | Typecheck del proyecto (`astro check`)        |
| `pnpm start`    | Sirve `dist/` localmente (simula producción)  |
| `pnpm preview`  | Preview del build                             |

## Despliegue en cPanel

### Configuración única

1. **Setup Node.js App** → crear aplicación con estos valores:

   | Campo | Valor |
   | :--- | :--- |
   | Versión de Node.js | **24.x** (LTS; mínimo requerido: 22.12) |
   | Modo de aplicación | **Production** |
   | Raíz de aplicación | `travelheight` (debe coincidir con la ruta del clon Git) |
   | URL de la aplicación | `travelheight.cl` |
   | Archivo de inicio | `server.cjs` |

2. **Git Version Control** → clonar el repositorio con
   Clone Path = `/home/USUARIO/travelheight` (la misma raíz de aplicación).
3. Ejecutar **Run NPM Install** y luego **Restart** desde la app Node.
4. Opcional: añadir variable de entorno `NODE_ENV=production`.

### Despliegues siguientes

Basado en la [guía oficial de Git Deployment de cPanel](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-deployment/).
El repositorio necesita: `.cpanel.yml` en la raíz ✅, al menos una rama ✅ y
**árbol de trabajo limpio** (este repo ignora `dist/`, `node_modules/` y
`tmp/`, que son los artefactos que genera el deploy).

**Modo pull (recomendado):**

```text
git push → GitHub/GitLab
cPanel » Git Version Control » Pull or Deploy:
  1. "Update from Remote"   (trae los cambios)
  2. "Deploy HEAD Commit"   (ejecuta .cpanel.yml)
```

**Modo push (opcional, sin GitHub):** añade el repositorio del servidor como
segundo remote y el hook post-receive de cPanel despliega automáticamente:

```sh
git remote add production ssh://USUARIO@servidor:PUERTO/home/USUARIO/travelheight
git push production master
```

En ambos casos `.cpanel.yml` ejecuta:
`npm install` → `npm run build` → `touch tmp/restart.txt`.

El servidor (`server.cjs`) sirve `dist/` con URLs limpias, gzip,
cache inmutable para `/_astro/` y página 404 personalizada.
`.cpanel.yml` detecta automáticamente el binario del selector CloudLinux
(`/opt/alt/alt-nodejs*/root/usr/bin`) y del venv de la app
(`~/nodevenv/<app>/<version>/bin`), incluido Node 24.

⚠️ No uses comodines (`*`) para copiar archivos en `.cpanel.yml`: podría
desplegar el directorio `.git` y causar problemas graves (advertencia oficial).

## Configuración de contacto

Los datos de contacto (teléfono, WhatsApp, email, dirección) viven en
`src/config/site.ts`. El número de WhatsApp se usa para los envíos de los
formularios de contacto y cotización (no hay backend; los formularios abren
una conversación de WhatsApp prellenada).
