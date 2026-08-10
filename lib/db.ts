import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "games.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Otros',
    tags TEXT NOT NULL DEFAULT '[]',
    thumbnail_url TEXT,
    banner_url TEXT,
    game_url TEXT NOT NULL,
    plays INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 0,
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    excerpt TEXT NOT NULL DEFAULT '',
    game_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const defaultCategories = ["Acción", "Aventura", "Arcade", "Estrategia", "Puzzle", "Deportes", "Otros"];

const insertCategory = db.prepare(
  "INSERT OR IGNORE INTO categories (name) VALUES (?)"
);
for (const name of defaultCategories) {
  insertCategory.run(name);
}