# AGENTS.md

Guía para agentes que trabajan en este repo. Sitio corporativo **Travel Height SpA** (Chile): Astro 6 + Tailwind CSS 4, salida 100% estática, alojado en cPanel compartido. Contenido del sitio y mensajes de commit en español.

## Comandos

```sh
pnpm install          # pnpm es el gestor local
pnpm dev              # desarrollo en localhost:4321
pnpm build            # build de producción a dist/
pnpm check            # astro check (typecheck) — la verificación principal
node --check server.cjs   # validar sintaxis del servidor de producción
pnpm start                # sirve dist/ localmente (carga .env si existe)
```

- **No hay tests.** Verificar con: `pnpm check` → `pnpm build` → grep sobre `dist/` para confirmar el cambio (o ausencia de regresiones).
- Requiere **Node >=22.12** (`engines` en package.json).

## Reglas críticas

- **NUNCA compilar en el servidor**: el hosting cPanel compartido tiene límite de RAM (CloudLinux) y compilar Astro produce OOM/SIGABRT. El build es siempre local.
- **`dist/` NO se versiona** (está en `.gitignore`). Flujo: código viaja por Git → contenido se entrega subiendo `dist/` por FTP al servidor. Un pull en cPanel NO actualiza lo visible.
- **TypeScript fijado en `^6`**: no actualizar a 7 (TS nativo) — rompe `astro check`.
- **Nunca hardcodear teléfonos, emails ni razón social** en páginas/componentes: todo sale de `src/config/site.ts` (footer, página legal de privacidad, botón de emergencias y WhatsApp ya leen de ahí).

## Datos del negocio — estado pendiente

- Los datos reales están incompletos: ver `.docs/cuestionario.md` (carpeta ignorada por git).
- Confirmado hasta ahora: teléfono/WhatsApp `+56 9 8284 8573`, email `contacto@travelheight.cl`, razón social `Travel Height SpA`, Registro MINVU N° 387, experiencia **30+ años**.
- **Pendiente**: dirección física, proyectos reales ("500+" es placeholder), cobertura, tiempo de respuesta ("<120 min" sigue publicado), clientes reales (**`proyectos.astro` aún muestra 4 proyectos inventados**).
- El número de WhatsApp se asumió igual al móvil de emergencias; falta confirmación del cliente.
- **No reponer credenciales eliminadas**: ISO 9001 y NCh 440 se quitaron porque la empresa NO las tiene. La única credencial válida publicable es el Registro MINVU N° 387.

## Despliegue (cPanel)

Dos modos documentados en README:

- **Estático (recomendado)**: subir contenido de `dist/` a `public_html` por FTP. El `.htaccess` dentro de `dist/` aporta 404 personalizada, gzip, cache y redirecciones. ⚠️ **Sin Node/Passenger los formularios no envían** (el endpoint `/api/contact` vive en `server.cjs`).
- **Node/Passenger**: app apuntando a `server.cjs` (cero dependencias: no ejecutar npm install en el servidor). Define las variables de entorno en *Environment variables*: `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` (ver `.env.example`). Ojo: **`.htaccess` no aplica detrás de Passenger**; `server.cjs` replica las redirecciones por código.

Gotchas:

- Todo debe canonicar a `https://www.travelheight.cl` (con www): `siteConfig.url`, sitemap y ambos servidores ya lo hacen — mantener coherencia al agregar rutas.
- Si existe una app Node registrada en el panel para el dominio, Passenger captura el tráfico aunque los archivos estén en `public_html`: hay que eliminarla en *Setup Node.js App*.
- Si el archivo de inicio indicado en el panel no existe en la carpeta, cPanel genera un `app.js` demo ("It works!") que es lo que sirve el dominio.

## Formularios

Los formularios de contacto y cotización (`index.astro`, `cotizacion.astro`)
hacen `POST` en JSON a `/api/contact`. Ese endpoint vive en **`server.cjs`**
(no en Astro, el front es estático): valida nombre/email y reenvía el mensaje
por email vía **Resend** con `reply_to` = correo del solicitante. Configuración
por variables de entorno (`RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`; ver
`.env.example` — el `.env` real no se versiona). Sin `RESEND_API_KEY` la API
responde 500. No hay base de datos: no crear otros endpoints.

`whatsappUrl()` de `src/config/site.ts` queda solo para las páginas de
emergencias y eliminación de datos (enlaces directos a `wa.me`).

## Skills de agentes instaladas

Este proyecto usa skills locales (carpetas `.agents/skills/`, ignoradas por git — **no viajan con el repo**). Si se clona o despliega en otro entorno, reinstalarlas con el CLI de skills (`npx skills add <owner/repo>@<skill> -y`, instala local sin `-g`):

| Skill | Fuente | Uso en este repo |
|---|---|---|
| `seo-audit` | `coreyhaines31/marketingskills` | Auditorías técnicas y on-page SEO |
| `copywriting` | `coreyhaines31/marketingskills` | Redacción de copy del sitio |
| `ai-seo` | `coreyhaines31/marketingskills` | Optimización para citación por IA (GEO) |
| `content-strategy` | `coreyhaines31/marketingskills` | Planificación de contenido |
| `web-design-guidelines` | `vercel-labs/agent-skills` | Revisión de UI/accesibilidad |
| `seo-aeo-best-practices` | `sanity-io/agent-toolkit` | Metadata, JSON-LD, EEAT |
| `seo-geo` | `resciencelab/opc-skills` | SEO + GEO (schemas, keywords) |
| `seo` | `addyosmani/web-quality-skills` | SEO técnico/calidad web |

Nota: la capa SEO/GEO/AEO implementada (componentes en `src/components/seo/`, `llms.txt`, schemas) se apoyó en estas skills; los archivos generados SÍ se versionan.

## Entorno local (Windows)

- Shell: PowerShell 5.1 — no soporta `??` ni `&&`; encadenar con `; if ($?) { ... }`.
- `rg` no está en PATH: usar la herramienta Grep. `curl.exe` sí está disponible.
