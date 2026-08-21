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
3. Botón **Restart** en la app Node (no se necesita Run NPM Install:
   `server.cjs` no tiene dependencias).
4. Opcional: añadir variable de entorno `NODE_ENV=production`.

### Despliegues siguientes

> **Importante:** el build se hace **localmente**, no en el servidor. Los
> hosts compartidos cPanel tienen límites de RAM (CloudLinux) y compilar
> Astro allí produce OOM (`memory allocation failed`, SIGABRT). Por eso
> `dist/` se versiona con el repo y `.cpanel.yml` solo reinicia la app.

Basado en la [guía oficial de Git Deployment de cPanel](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-deployment/).
El repositorio necesita: `.cpanel.yml` en la raíz ✅, al menos una rama ✅ y
**árbol de trabajo limpio**.

**Flujo de publicación:**

```sh
# 1. Compilar localmente (requiere Node >= 22.12)
pnpm build

# 2. Versionar el build y subir
git add dist
git commit -m "Build"
git push

# 3. En cPanel » Git Version Control » Pull or Deploy:
#    "Update from Remote" → "Deploy HEAD Commit"
#    (.cpanel.yml verifica dist/ y toca tmp/restart.txt para reiniciar)
```

**Modo push (opcional, sin GitHub):** añade el repositorio del servidor como
segundo remote y el hook post-receive de cPanel despliega automáticamente:

```sh
git remote add production ssh://USUARIO@servidor:PUERTO/home/USUARIO/travelheight
git push production master
```

`server.cjs` usa solo módulos nativos de Node: el servidor no necesita
`node_modules`. Sirve `dist/` con URLs limpias, gzip, cache inmutable para
`/_astro/` y página 404 personalizada.

⚠️ No uses comodines (`*`) para copiar archivos en `.cpanel.yml`: podría
desplegar el directorio `.git` y causar problemas graves (advertencia oficial).

## Configuración de contacto

Los datos de contacto (teléfono, WhatsApp, email, dirección) viven en
`src/config/site.ts`. El número de WhatsApp se usa para los envíos de los
formularios de contacto y cotización (no hay backend; los formularios abren
una conversación de WhatsApp prellenada).
