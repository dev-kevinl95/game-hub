import AdmZip from "adm-zip";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sb } from "./db";

const GAMES_BUCKET = "games";
const IMAGES_BUCKET = "images";

export class UploadError extends Error {}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const MIME_BY_EXT: Record<string, string> = {
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

export function contentType(name: string): string {
  return MIME_BY_EXT[path.extname(name).toLowerCase()] ?? "application/octet-stream";
}

function publicUrl(bucket: string, filePath: string): string {
  const { data } = sb.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

function imageExtension(file: File): string {
  const fromType = file.type.split("/")[1];
  const ext = fromType ? `.${fromType}` : path.extname(file.name).toLowerCase();
  return ALLOWED_IMAGE_EXT.has(ext) ? ext : ".png";
}

function isAllowedImage(file: File): boolean {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) return true;
  const ext = path.extname(file.name).toLowerCase();
  return ALLOWED_IMAGE_EXT.has(ext);
}

async function uploadDir(root: string, prefix: string): Promise<void> {
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
          upsert: false,
        });
      if (error) {
        throw new UploadError(`No se pudo subir ${objectPath}: ${error.message}`);
      }
    }
  }
}

async function listAllObjects(bucket: string, prefix: string): Promise<string[]> {
  const objects: string[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb.storage
      .from(bucket)
      .list(prefix, { limit: 200, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const itemPath = `${prefix}/${item.name}`;
      if (item.id) {
        objects.push(itemPath);
      } else {
        objects.push(...(await listAllObjects(bucket, itemPath)));
      }
    }
    offset += data.length;
  }
  return objects;
}

async function removeAllObjects(bucket: string, prefix: string): Promise<void> {
  const objects = await listAllObjects(bucket, prefix);
  while (objects.length > 0) {
    const batch = objects.splice(0, 100);
    const { error } = await sb.storage.from(bucket).remove(batch);
    if (error) throw error;
  }
}

const ZIPS_PREFIX = "zips";

export async function createZipUpload(): Promise<{
  zipPath: string;
  uploadUrl: string;
}> {
  const folderName = crypto.randomUUID();
  const objectPath = `${ZIPS_PREFIX}/${folderName}.zip`;
  const { data, error } = await sb.storage
    .from(GAMES_BUCKET)
    .createSignedUploadUrl(objectPath, { upsert: false });
  if (error || !data) {
    throw new UploadError(`No se pudo crear la URL de subida: ${error?.message}`);
  }
  return { zipPath: objectPath, uploadUrl: data.signedUrl };
}

async function removeZipUpload(zipPath: string): Promise<void> {
  const { error } = await sb.storage.from(GAMES_BUCKET).remove([zipPath]);
  if (error) {
    console.error(`No se pudo limpiar el zip temporal ${zipPath}:`, error.message);
  }
}

export async function storeGameZipFromStorage(zipPath: string): Promise<{
  folderName: string;
  gameUrl: string;
}> {
  const { data: blob, error } = await sb.storage
    .from(GAMES_BUCKET)
    .download(zipPath);
  if (error || !blob) {
    throw new UploadError(`No se pudo leer el zip desde el almacenamiento`);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gamezip-"));
  try {
    const zip = new AdmZip(Buffer.from(await blob.arrayBuffer()));
    zip.extractAllTo(tempDir, true);
  } catch (err) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    await removeZipUpload(zipPath);
    throw new UploadError(
      `No se pudo descomprimir el zip: ${(err as Error).message}`
    );
  }

  const gameRoot = findGameRoot(tempDir);
  if (!gameRoot) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    await removeZipUpload(zipPath);
    throw new UploadError(
      "El zip no contiene un archivo index.html en su raíz"
    );
  }

  const folderName = zipPath
    .replace(new RegExp(`^${ZIPS_PREFIX}/`), "")
    .replace(/\.zip$/, "");

  try {
    await uploadDir(gameRoot, folderName);
  } catch (err) {
    await removeAllObjects(GAMES_BUCKET, folderName).catch(() => {});
    fs.rmSync(tempDir, { recursive: true, force: true });
    await removeZipUpload(zipPath);
    if (err instanceof UploadError) throw err;
    throw new UploadError(
      `No se pudieron subir los archivos del juego: ${(err as Error).message}`
    );
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
  await removeZipUpload(zipPath);
  return {
    folderName,
    gameUrl: publicUrl(GAMES_BUCKET, `${folderName}/index.html`),
  };
}

function findGameRoot(dir: string): string | null {
  if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory());
  if (dirs.length === 1) {
    const nested = path.join(dir, dirs[0].name);
    if (fs.existsSync(path.join(nested, "index.html"))) return nested;
  }
  return null;
}

export async function saveImage(
  gameId: number,
  field: "thumbnail" | "banner",
  file: File | null
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!isAllowedImage(file)) {
    throw new UploadError(
      `El archivo ${field} debe ser JPG, PNG, WEBP o GIF`
    );
  }

  const ext = imageExtension(file);
  const objectPath = `${gameId}/${field}${ext}`;
  const { error } = await sb.storage
    .from(IMAGES_BUCKET)
    .upload(objectPath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || contentType(`${field}${ext}`),
      upsert: true,
    });
  if (error) {
    throw new UploadError(`No se pudo subir la imagen: ${error.message}`);
  }
  return publicUrl(IMAGES_BUCKET, objectPath);
}

export async function removeGameFolder(folderName: string): Promise<void> {
  if (!folderName) return;
  await removeAllObjects(GAMES_BUCKET, folderName);
}

export async function removeGameImages(gameId: number): Promise<void> {
  await removeAllObjects(IMAGES_BUCKET, String(gameId));
}

export function folderNameFromUrl(gameUrl: string): string {
  const match =
    gameUrl.match(/\/storage\/v1\/object\/public\/games\/([^/]+)\//) ||
    gameUrl.match(/^\/games\/([^/]+)\//);
  return match ? match[1] : "";
}