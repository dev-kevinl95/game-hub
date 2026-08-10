# Portal de juegos HTML5

Plataforma estilo Poki/CrazyGames construida con **Next.js 16 + TypeScript + SQLite**. Página pública con galería de juegos jugables (SEO-friendly) y un panel de administración privado para subir y gestionar juegos.

## Stack

- **Next.js 16 (App Router)** — SSR/SSG para SEO, API routes para el backend
- **TypeScript**
- **better-sqlite3** — base de datos en un archivo (`data/games.db`)
- **jsonwebtoken** — autenticación del panel admin (JWT)
- **adm-zip** — descompresión de los juegos subidos en `.zip`
- **CSS puro** — sin frameworks de estilos

## Estructura

```
app/
├── page.tsx              # Galería pública (SSR, revalida cada 60s)
├── game/[id]/            # Página de juego (SSG + generateMetadata para SEO)
│   ├── page.tsx
│   └── GamePlayer.tsx    # iframe jugable + contador de partidas
├── admin/page.tsx        # Panel de administración (client)
└── api/
    ├── games/            # GET lista de juegos
    ├── games/[id]/       # GET detalle, POST incrementar partidas
    └── admin/
        ├── login/        # POST login (devuelve JWT)
        ├── games/        # POST crear juego (multipart)
        ├── games/[id]/   # PUT editar, DELETE borrar
        └── categories/   # GET/POST categorías
lib/
├── db.ts                 # Conexión SQLite + esquema
├── games.ts              # Capa de acceso a datos
├── auth.ts               # JWT + login
└── storage.ts            # Extracción de ZIPs, guardado de imágenes
public/
├── games/<uuid>/         # Juegos descomprimidos (servidos para el iframe)
└── images/<id>/          # Miniaturas y banners
data/games.db             # Base de datos (gitignored)
```

## Puesta en marcha

1. Instalar dependencias:

```bash
npm install
```

2. Configurar las variables de entorno (copiar `.env.example` a `.env` y editar):

```bash
# .env
ADMIN_PASSWORD=tu-contraseña-secreta
JWT_SECRET=genera-uno-con-openssl-rand-hex-32
```

3. Arrancar en desarrollo:

```bash
npm run dev
```

La web estará en `http://localhost:3000` y el panel admin en `/admin`.

## Skills del proyecto

El repositorio versiona sus skills en `.agents/skills/` (con `skills-lock.json` para fijar la versión) para que todo colaborador herede el mismo comportamiento.

- **`git-commit`** — genera commits Conventional Commits a partir del diff. Se activa al pedir "haz un commit" / "commit".

Los `SKILL.md` ya funcionan sin pasos extra al clonar. Para **sincronizar / actualizar** la versión fijada en `skills-lock.json`, instala el CLI y vuelve a agregar:

```bash
npx skills add https://github.com/github/awesome-copilot --skill git-commit
```

## Subir un juego

1. Entra en `/admin` con tu contraseña.
2. En el formulario indica: título, categoría, descripción, etiquetas y una imagen de miniatura (opcional).
3. Sube el juego como un **`.zip`**. El backend lo descomprime y sirve sus archivos automáticamente.
4. Requisito del `.zip`: debe contener un `index.html` en la raíz o en una única subcarpeta (el caso típico de exportaciones de Unity/Construct/Godot).

## Panel de administración y seguridad

- La contraseña y la clave JWT viven **solo en el backend** (`.env`). Nunca se envían al navegador.
- El login devuelve un token JWT de 7 días que se guarda en `localStorage` y se envía en cada petición admin.
- Cualquier petición a `/api/admin/*` sin token válido devuelve `401`.
- El panel permite: subir, editar (título, descripción, categoría, tags, destacado, imágenes) y borrar juegos, además de crear nuevas categorías.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servidor de producción
- `npm run lint` — ESLint
