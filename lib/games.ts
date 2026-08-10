import { db } from "./db";

export type Category = {
  id: number;
  name: string;
};

export type Game = {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail_url: string | null;
  banner_url: string | null;
  game_url: string;
  plays: number;
  rating: number;
  featured: number;
  created_at: string;
};

type GameRow = {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string;
  thumbnail_url: string | null;
  banner_url: string | null;
  game_url: string;
  plays: number;
  rating: number;
  featured: number;
  created_at: string;
};

function mapGame(row: GameRow): Game {
  return { ...row, tags: JSON.parse(row.tags || "[]") as string[] };
}

const selectColumns = `
  id, title, description, category, tags, thumbnail_url,
  banner_url, game_url, plays, rating, featured, created_at
`;

export function listGames(): Game[] {
  const rows = db
    .prepare(`SELECT ${selectColumns} FROM games ORDER BY featured DESC, created_at DESC`)
    .all() as GameRow[];
  return rows.map(mapGame);
}

export function getGame(id: number): Game | null {
  const row = db.prepare(`SELECT ${selectColumns} FROM games WHERE id = ?`).get(id) as
    | GameRow
    | undefined;
  return row ? mapGame(row) : null;
}

export function incrementPlays(id: number): void {
  db.prepare("UPDATE games SET plays = plays + 1 WHERE id = ?").run(id);
}

export function createGame(data: Omit<Game, "id" | "created_at" | "plays" | "rating">): Game {
  const info = db
    .prepare(
      `INSERT INTO games (title, description, category, tags, thumbnail_url, banner_url, game_url, featured)
       VALUES (@title, @description, @category, @tags, @thumbnail_url, @banner_url, @game_url, @featured)`
    )
    .run({
      title: data.title,
      description: data.description,
      category: data.category,
      tags: JSON.stringify(data.tags),
      thumbnail_url: data.thumbnail_url,
      banner_url: data.banner_url,
      game_url: data.game_url,
      featured: data.featured,
    });
  return getGame(info.lastInsertRowid as number)!;
}

export function updateGame(
  id: number,
  data: Partial<Pick<Game, "title" | "description" | "category" | "tags" | "featured">>
): Game | null {
  const current = getGame(id);
  if (!current) return null;

  db.prepare(
    `UPDATE games SET title = @title, description = @description, category = @category,
     tags = @tags, featured = @featured WHERE id = @id`
  ).run({
    id,
    title: data.title ?? current.title,
    description: data.description ?? current.description,
    category: data.category ?? current.category,
    tags: JSON.stringify(data.tags ?? current.tags),
    featured: data.featured ?? current.featured,
  });
  return getGame(id);
}

export function deleteGame(id: number): boolean {
  const info = db.prepare("DELETE FROM games WHERE id = ?").run(id);
  return info.changes > 0;
}

export function listCategories(): Category[] {
  return db.prepare("SELECT id, name FROM categories ORDER BY name").all() as Category[];
}