# AGENTS.md

Guía para agentes que trabajan en este repo. Sitio corporativo **Travel Height SpA** (Chile): Astro 6 + Tailwind CSS 4, salida 100% estática, alojado en cPanel compartido. Contenido del sitio y mensajes de commit en español.

## Comandos

```sh
pnpm install          # pnpm es el gestor local
pnpm dev              # desarrollo en localhost:4321
pnpm build            # build de producción a dist/
pnpm check            # astro check (typecheck) — la verificación principal
node --check server.cjs   # validar sintaxis del servidor de producción
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

- **Estático (recomendado)**: subir contenido de `dist/` a `public_html` por FTP. El `.htaccess` dentro de `dist/` aporta 404 personalizada, gzip, cache y redirecciones.
- **Node/Passenger**: app apuntando a `server.cjs` (cero dependencias: no ejecutar npm install en el servidor). Ojo: **`.htaccess` no aplica detrás de Passenger**; `server.cjs` replica las redirecciones por código.

Gotchas:

- Todo debe canonicar a `https://www.travelheight.cl` (con www): `siteConfig.url`, sitemap y ambos servidores ya lo hacen — mantener coherencia al agregar rutas.
- Si existe una app Node registrada en el panel para el dominio, Passenger captura el tráfico aunque los archivos estén en `public_html`: hay que eliminarla en *Setup Node.js App*.
- Si el archivo de inicio indicado en el panel no existe en la carpeta, cPanel genera un `app.js` demo ("It works!") que es lo que sirve el dominio.

## Formularios

Sin backend: los formularios de contacto/cotización abren una conversación de WhatsApp prellenada vía `wa.me` usando `whatsappUrl()` de `src/config/site.ts`. No esperar POSTs ni crear endpoints.

## Entorno local (Windows)

- Shell: PowerShell 5.1 — no soporta `??` ni `&&`; encadenar con `; if ($?) { ... }`.
- `rg` no está en PATH: usar la herramienta Grep. `curl.exe` sí está disponible.
