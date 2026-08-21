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

El sitio es **100% estático** (`dist/` contiene solo HTML/CSS/JS). Hay dos
formas de publicarlo; la Opción A es la más simple y recomendada.

> **Importante:** el build se hace siempre **localmente**, no en el servidor.
> Los hosts compartidos cPanel tienen límites de RAM (CloudLinux) y compilar
> Astro allí produce OOM (`memory allocation failed`, SIGABRT).

### Opción A — Archivos estáticos en `public_html` (recomendada)

Sin Node, sin Passenger, sin puertos ni reinicios. LiteSpeed/Apache sirve
todo directamente; el `.htaccess` incluido en `dist/` aporta 404
personalizada, gzip, cache, HTTPS y cabeceras de seguridad.

1. Compila: `pnpm build`
2. Sube el **contenido completo** de `dist/` a `public_html/`
   (FTP con FileZilla, o Git con las tareas de abajo).
3. Listo. Si antes existía una app Node registrada para el dominio,
   elimínala en *Setup Node.js App* (si no, Passenger seguiría capturando
   el tráfico del dominio).

Deploy automatizado vía Git (patrón oficial de cPanel): reemplaza las tareas
de `.cpanel.yml` por:

```yaml
---
deployment:
  tasks:
    - export DEPLOYPATH=/home/USUARIO/public_html/
    - /bin/cp -R dist/* $DEPLOYPATH
```

### Opción B — Aplicación Node.js (Passenger)

Mantiene `server.cjs` como servidor estático. Útil si el hosting bloquea
`.htaccess` o quieres lógica de servidor propia más adelante.

1. **Setup Node.js App** → crear aplicación:

   | Campo | Valor |
   | :--- | :--- |
   | Versión de Node.js | **24.x** (LTS; mínimo requerido: 22.12) |
   | Modo de aplicación | **Production** |
   | Raíz de aplicación | `travelheight` (debe coincidir con la ruta del clon Git) |
   | URL de la aplicación | `travelheight.cl` |
   | Archivo de inicio | **`server.cjs`** |

   ⚠️ Si el archivo de inicio no existe en la carpeta, el panel genera un
   `app.js` demo que responde "It works!" — es la causa clásica de que el
   dominio muestre la demo en vez del sitio.

2. **Git Version Control** → clonar el repositorio con
   Clone Path = `/home/USUARIO/travelheight` (la misma raíz de aplicación).
3. Botón **Restart** en la app Node (no se necesita Run NPM Install:
   `server.cjs` no tiene dependencias).
4. Opcional: añadir variable de entorno `NODE_ENV=production`.

### Flujo de publicación (común a ambas)

Basado en la [guía oficial de Git Deployment de cPanel](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-deployment/).
El repositorio necesita: `.cpanel.yml` en la raíz ✅, al menos una rama ✅ y
**árbol de trabajo limpio**.

```sh
# 1. Compilar localmente (requiere Node >= 22.12)
pnpm build

# 2. Versionar el build y subir
git add -A
git commit -m "Build"
git push

# 3. En cPanel » Git Version Control » Pull or Deploy:
#    "Update from Remote" → "Deploy HEAD Commit"
```

**Modo push (opcional, sin GitHub):** añade el repositorio del servidor como
segundo remote y el hook post-receive de cPanel despliega automáticamente:

```sh
git remote add production ssh://USUARIO@servidor:PUERTO/home/USUARIO/travelheight
git push production master
```

⚠️ No uses comodines sueltos (`*`) al copiar archivos en `.cpanel.yml`:
podría desplegar el directorio `.git` y causar problemas graves (advertencia
oficial). El patrón `dist/*` es seguro porque solo copia esa carpeta.

## Configuración de contacto

Los datos de contacto (teléfono, WhatsApp, email, dirección) viven en
`src/config/site.ts`. El número de WhatsApp se usa para los envíos de los
formularios de contacto y cotización (no hay backend; los formularios abren
una conversación de WhatsApp prellenada).
