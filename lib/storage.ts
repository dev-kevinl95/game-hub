import AdmZip from "adm-zip";
import fs from "node:fs";
import path from "node:path";

const GAMES_DIR = path.join(process.cwd(), "public", "games");
const IMAGES_DIR = path.join(process.cwd(), "public", "images");

fs.mkdirSync(GAMES_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });

export class UploadError extends Error {}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

async function readBuffer(file: File): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer());
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

  const dir = path.join(IMAGES_DIR, String(gameId));
  fs.mkdirSync(dir, { recursive: true });
  const ext = imageExtension(file);
  const filename = `${field}${ext}`;
  fs.writeFileSync(path.join(dir, filename), await readBuffer(file));
  return `/images/${gameId}/${filename}`;
}

export async function storeGameZip(file: File): Promise<{
  folderName: string;
  gameUrl: string;
}> {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new UploadError("El archivo del juego debe ser un .zip");
  }

  const tempDir = path.join(GAMES_DIR, `.tmp-${crypto.randomUUID()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const zip = new AdmZip(await readBuffer(file));
    zip.extractAllTo(tempDir, true);
  } catch (err) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new UploadError(
      `No se pudo descomprimir el zip: ${(err as Error).message}`
    );
  }

  const gameRoot = findGameRoot(tempDir);
  if (!gameRoot) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new UploadError(
      "El zip no contiene un archivo index.html en su raíz"
    );
  }

  const folderName = crypto.randomUUID();
  const finalDir = path.join(GAMES_DIR, folderName);
  fs.renameSync(gameRoot, finalDir);
  if (gameRoot !== tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  return {
    folderName,
    gameUrl: `/games/${folderName}/index.html`,
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

export function removeGameFolder(folderName: string): void {
  const target = path.join(GAMES_DIR, folderName);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

export function removeGameImages(gameId: number): void {
  const target = path.join(IMAGES_DIR, String(gameId));
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

export function folderNameFromUrl(gameUrl: string): string {
  const match = gameUrl.match(/^\/games\/([^/]+)\//);
  return match ? match[1] : "";
}