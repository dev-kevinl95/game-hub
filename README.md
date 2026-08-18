# Game Hub — Mis juegos HTML5

Página personal donde publico mis propios videojuegos HTML5 directamente en el navegador, con un poco de información sobre mí, un blog y un panel de administración privado para gestionarlo todo.

## Qué encontrarás aquí

- **Galería de mis juegos** — cada juego es una creación propia, jugable al instante desde el navegador, sin descargas ni instalaciones.
- **Página de juego** — reproductor con pantalla completa y soporte móvil, descripción, etiquetas y contador de partidas.
- **Sobre mí** — perfil con mis redes sociales (GitHub, LinkedIn y YouTube).
- **Blog** — artículos sobre el desarrollo de mis juegos, escritos en Markdown.
- **Panel de administración privado** — solo yo (el único admin) subo y gestiono los juegos y el contenido.

## Stack

- **Next.js 16 (App Router)** — SSR/SSG para SEO, API routes para el backend
- **TypeScript**
- **Supabase (PostgreSQL + Storage)** — base de datos y almacenamiento de juegos e imágenes
- **jsonwebtoken** — autenticación del panel admin (JWT)
- **adm-zip** — descompresión de los juegos subidos en `.zip`
- **react-markdown + remark-gfm** — renderizado del blog
- **CSS puro** — sin frameworks de estilos

## Estructura

```
app/
├── page.tsx              # Portada: perfil + galería pública (SSR, revalida 60s)
├── game/[id]/            # Página de juego (SSG + generateMetadata para SEO)
│   ├── page.tsx
│   └── GamePlayer.tsx    # Reproductor (iframe + contador de partidas + pantalla completa)
├── blog/                 # Índice y detalle de artículos del blog
├── admin/page.tsx        # Panel de administración (client, requiere JWT)
└── api/
    ├── games/            # GET lista de juegos
    ├── games/[id]/       # GET detalle, POST incrementar partidas
    ├── play/[folder]/    # GET proxy de archivos del juego (con Content-Type correcto)
    └── admin/
        ├── login/        # POST login (devuelve JWT)
        ├── posts/        # GET/POST artículos de blog
        ├── posts/[id]/   # PUT/DELETE artículos
        ├── games/        # POST crear juego (multipart)
        ├── games/[id]/   # PUT editar, DELETE borrar
        └── categories/   # GET/POST categorías
lib/
├── db.ts                 # Cliente Supabase (solo server)
├── games.ts              # Capa de acceso a datos de juegos
├── posts.ts              # Capa de acceso a datos del blog
├── auth.ts               # JWT + login
└── storage.ts            # Extracción de ZIPs, subida a Supabase Storage y borrado
components/
├── AdminLink.tsx         # Link a Admin, solo visible si hay sesión
├── ProfileHeader.tsx     # Perfil personal con redes sociales
└── Faq.tsx               # Preguntas frecuentes
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
SUPABASE_URL=https://tu-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

3. Arrancar en desarrollo:

```bash
npm run dev
```

La web estará en `http://localhost:3000`.

## Supabase

- **Base de datos** — tablas y helpers de Postgres gestionados en tu proyecto de Supabase.
- **Storage** — dos buckets públicos: `games` (los zips descomprimidos) y `images` (miniaturas y banners).
- La `SUPABASE_SERVICE_ROLE_KEY` es sensible: solo se usa en el servidor.

## Publicar un juego

1. Entra en `/admin` con tu contraseña (el acceso al panel es privado).
2. En el formulario indica: título, categoría, descripción, etiquetas y una imagen de miniatura (opcional).
3. Sube el juego como un **`.zip`**. El backend lo descomprime y sube sus archivos a Supabase Storage.
4. Requisito del `.zip`: debe contener un `index.html` en la raíz o en una única subcarpeta (el caso típico de exportaciones de Unity/Construct/Godot).

## Blog

- Escribe artículos en **Markdown** desde `/admin`.
- Cada post puede asociarse a un juego para enlazarlo.
- Las páginas del blog son estáticas con SEO (`generateStaticParams` + `generateMetadata`).

## Panel de administración y seguridad

- La contraseña y la clave JWT viven **solo en el backend** (`.env`). Nunca se envían al navegador.
- El login devuelve un token JWT de 7 días que se guarda en `localStorage` y se envía en cada petición admin.
- Cualquier petición a `/api/admin/*` sin token válido devuelve `401`.
- El enlace "Admin" de la navegación solo aparece si hay sesión; el resto solo ve juegos y el blog.
- El panel permite: subir, editar (título, descripción, categoría, tags, destacado, imágenes) y borrar juegos, gestionar categorías y publicar/editar/borrar artículos del blog.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servidor de producción
- `npm run lint` — ESLint