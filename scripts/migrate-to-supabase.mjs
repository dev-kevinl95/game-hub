/* Migración one-time de la data local (SQLite + public/games + public/images) a Supabase.
 *
 * Uso:
 *   node --env-file=.env.local scripts/migrate-to-supabase.mjs
 *
 * Requiere variables en .env.local / .env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Y los buckets "games" e "images" creados y públicos en Supabase.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = path.join(ROOT, "data");
const GAMES_DIR = path.join(ROOT, "public", "games");
const IMAGES_DIR = path.join(ROOT, "public", "images");

const GAMES_BUCKET = "games";
const IMAGES_BUCKET = "images";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const MIME_BY_EXT = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
};

function contentType(name) {
  return MIME_BY_EXT[path.extname(name).toLowerCase()] ?? "application/octet-stream";
}

function publicUrl(bucket, filePath) {
  const { data } = sb.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

function folderNameFromUrl(gameUrl) {
  const match =
    gameUrl.match(/\/storage\/v1\/object\/public\/games\/([^/]+)\//) ||
    gameUrl.match(/^\/games\/([^/]+)\//);
  return match ? match[1] : "";
}

function toIso(sqliteDate) {
  return sqliteDate ? sqliteDate.replace(" ", "T") + "Z" : null;
}

async function uploadDir(root, prefix) {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await uploadDir(full, `${prefix}/${entry.name}`);
    } else if (entry.isFile()) {
      const objectPath = `${prefix}/${entry.name}`;
      const { error } = await sb.storage
        .from(GAMES_BUCKET)
        .upload(objectPath, fs.readFileSync(full), {
          contentType: contentType(entry.name),
          upsert: true,
        });
      if (error) throw new Error(`Subida fallida ${objectPath}: ${error.message}`);
    }
  }
}

async function uploadImages(gameId) {
  const dir = path.join(IMAGES_DIR, String(gameId));
  if (!fs.existsSync(dir)) return {};
  const result = {};
  for (const name of fs.readdirSync(dir)) {
    const objectPath = `${gameId}/${name}`;
    const { error } = await sb.storage
      .from(IMAGES_BUCKET)
      .upload(objectPath, fs.readFileSync(path.join(dir, name)), {
        contentType: contentType(name),
        upsert: true,
      });
    if (error) throw new Error(`Subida fallida ${objectPath}: ${error.message}`);
    if (name.startsWith("thumbnail")) result.thumbnail_url = publicUrl(IMAGES_BUCKET, objectPath);
    if (name.startsWith("banner")) result.banner_url = publicUrl(IMAGES_BUCKET, objectPath);
  }
  return result;
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  }
  const dbFile = path.join(DATA_DIR, "games.db");
  if (!fs.existsSync(dbFile)) throw new Error(`No existe ${dbFile}`);

  const sqlite = new Database(dbFile, { readonly: true });

  const categories = sqlite.prepare("SELECT id, name FROM categories").all();
  for (const cat of categories) {
    const { data: existing } = await sb
      .from("categories")
      .select("id")
      .eq("name", cat.name)
      .maybeSingle();
    if (existing) continue;
    const { error } = await sb.from("categories").insert({ id: cat.id, name: cat.name });
    if (error) throw error;
    console.log(`Categoría: ${cat.name}`);
  }

  const games = sqlite.prepare("SELECT * FROM games").all();
  for (const game of games) {
    const folder = folderNameFromUrl(game.game_url);
    if (!folder || !fs.existsSync(path.join(GAMES_DIR, folder))) {
      throw new Error(
        `No se encontró la carpeta del juego "${game.title}" en public/games (${folder}).`
      );
    }
    await uploadDir(path.join(GAMES_DIR, folder), folder);
    const images = await uploadImages(game.id);

    const payload = {
      id: game.id,
      title: game.title,
      description: game.description,
      category: game.category,
      tags: game.tags,
      thumbnail_url: images.thumbnail_url ?? null,
      banner_url: images.banner_url ?? null,
      game_url: publicUrl(GAMES_BUCKET, `${folder}/index.html`),
      plays: game.plays,
      rating: game.rating,
      featured: game.featured,
      created_at: toIso(game.created_at),
    };
    const { error } = await sb.from("games").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    console.log(`Juego: ${game.title}`);
  }

  const posts = sqlite.prepare("SELECT * FROM posts").all();
  for (const post of posts) {
    const payload = {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      game_id: post.game_id,
      created_at: toIso(post.created_at),
    };
    const { error } = await sb.from("posts").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    console.log(`Post: ${post.slug}`);
  }

  sqlite.close();
  await sb.rpc("sync_sequences");
  console.log("Migración completada.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exitCode = 1;
});