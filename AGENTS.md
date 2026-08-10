<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Game Portal

Portal de juegos HTML5 (Poki/CrazyGames clone): galería pública + panel admin. **Next.js 16 (App Router) + TypeScript + better-sqlite3 + JWT.** Código y README en español.

## Comandos

- `npm run dev` — dev server (re-regenera este bloque AGENTS.md en cada arranque; no lo dejes en el diff sin commitear)
- `npm run build` / `npm run start` — producción
- `npm run lint` — ESLint (único check; **no hay** scripts de typecheck ni de tests). Verifica con `npx tsc --noEmit` si cambias tipos.

## Arquitectura

- **No es monorepo.** `app/` = páginas/API routes, `lib/` = capa de datos, `public/games/` + `public/images/` = media subida, `data/games.db` = SQLite.
- Path alias `@/*` → raíz del repo.
- **Capa de datos (`lib/db.ts`, `lib/games.ts`, `lib/storage.ts`) es solo servidor.** `better-sqlite3` está en `serverExternalPackages` (`next.config.ts`) y usar `fs`/`Database`/`adm-zip`. No importes estos módulos desde componentes client ("use client") — rompe el build.
- Esquema SQLite se crea/auto-migra al importar `lib/db.ts` (tablas `categories`, `games`; categorías por defecto sembradas). No hay migraciones ni CLI de DB.
- Autenticación admin = JWT (7 días) en `localStorage`; las rutas `/api/admin/*` exigen token válido (`verifyToken`).

## Datos y almacenamiento

- `.env` **obligatorio** (se lee al importar `lib/auth.ts`): `JWT_SECRET` y `ADMIN_PASSWORD` desde `.env.example`. Fallará en arranque si faltan.
- Subir juego = `.zip` con `index.html` en la raíz o en una única subcarpeta (exports de Unity/Construct/Godot). Se descomprime a `public/games/<uuid>/`. Las imágenes requieren JPG/PNG/WebP/GIF.
- `/data/`, `/public/games/`, `/public/images/`, `.env` están gitignored. **No** incluyas la DB ni la media subida en commits.
- Al borrar un juego, elimina su carpeta y sus imágenes (`removeGameFolder` / `removeGameImages`) — no solo el row.

## Flujo del juego público

- `app/page.tsx`: SSR, revalida 60s. `app/game/[id]/page.tsx`: SSG con `generateStaticParams` + ISR 60s + `generateMetadata` para SEO.
- `useSearchParams/revalidate`: no uses datos del admin en páginas estáticas.

## API

- Públicas: `GET /api/games`, `GET /api/games/[id]`, `POST /api/games/[id]` (incrementar plays).
- Admin (JWT): `POST /api/admin/login`, `POST /api/admin/games` (multipart), `PUT/DELETE /api/admin/games/[id]`, `GET/POST /api/admin/categories`.