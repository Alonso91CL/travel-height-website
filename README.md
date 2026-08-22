# Travel Height Elevadores — Sitio Web

Sitio corporativo de **Travel Height SPA**, empresa de ingeniería vertical en Chile: instalación, mantenimiento, modernización y emergencias 24/7.

Construido como **sitio 100% estático** con [Astro](https://astro.build) + [Tailwind CSS 4](https://tailwindcss.com), listo para desplegarse en **cPanel**: el contenido de `dist/` se sube por FTP a `public_html` (o se sirve con el servidor propio `server.cjs`). El código fuente se versiona en Git; el build no.

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
│   ├── components/      # Hero, Nav, MobileMenu, Footer, FAQ, StepCard
│   ├── config/site.ts   # configuración central: contacto, WhatsApp, navegación
│   ├── layouts/BaseLayout.astro   # layout base con SEO y scripts globales
│   ├── pages/           # index, servicios, emergencias, proyectos, nosotros,
│   │                    # cotizacion, privacidad, terminos, 404
│   └── styles/global.css
├── server.cjs           # servidor estático para Passenger/cPanel
└── .cpanel.yml          # tareas de despliegue de código vía Git
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
> Astro allí produce OOM (`memory allocation failed`, SIGABRT). Por eso
> `dist/` está en `.gitignore`: se compila localmente y se entrega al
> servidor por FTP.

### Opción A — Archivos estáticos en `public_html` (recomendada)

Sin Node, sin Passenger, sin puertos ni reinicios. LiteSpeed/Apache sirve
todo directamente; el `.htaccess` incluido en `dist/` aporta 404
personalizada, gzip, cache, HTTPS y cabeceras de seguridad.

1. Compila: `pnpm build`
2. Sube por FTP (FileZilla) el **contenido completo** de `dist/` a `public_html/`
3. Listo. Si antes existía una app Node registrada para el dominio,
   elimínala en *Setup Node.js App* (si no, Passenger seguiría capturando
   el tráfico del dominio).

Para actualizar solo algunas páginas, basta subir los archivos cambiados.

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
3. Compila localmente (`pnpm build`) y sube por FTP el contenido de
   `dist/` a `~/travelheight/dist/` (server.cjs sirve esa carpeta).
4. Botón **Restart** en la app Node (no se necesita Run NPM Install:
   `server.cjs` no tiene dependencias).
5. Opcional: añadir variable de entorno `NODE_ENV=production`.

### Flujo de trabajo

**Código** (componentes, textos, configuración) viaja por Git; **contenido
público** (`dist/`) viaja por FTP:

```sh
# 1. Cambios de código
git add -A && git commit -m "..." && git push

# 2. En cPanel » Git Version Control » Pull or Deploy:
#    "Update from Remote" → "Deploy HEAD Commit"
#    (.cpanel.yml sincroniza el código y reinicia la app Node si existe)

# 3. Si el cambio afecta lo que se ve: compilar y subir por FTP
pnpm build    # requiere Node >= 22.12
# → sube dist/ a public_html/ (Opción A) o ~/travelheight/dist/ (Opción B)
```

Basado en la [guía oficial de Git Deployment de cPanel](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-deployment/).
El repositorio necesita: `.cpanel.yml` en la raíz ✅, al menos una rama ✅ y
**árbol de trabajo limpio**.

**Modo push (opcional, sin GitHub):** añade el repositorio del servidor como
segundo remote y el hook post-receive de cPanel despliega el código
automáticamente:

```sh
git remote add production ssh://USUARIO@servidor:PUERTO/home/USUARIO/travelheight
git push production master
```

## Configuración de contacto

Los datos de contacto (teléfono, WhatsApp, email, dirección) viven en
`src/config/site.ts`. El número de WhatsApp se usa para los envíos de los
formularios de contacto y cotización (no hay backend; los formularios abren
una conversación de WhatsApp prellenada).
