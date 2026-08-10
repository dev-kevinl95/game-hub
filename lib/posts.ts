import { db } from "./db";
import { getGame } from "./games";

export type Post = {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  game_id: number | null;
  created_at: string;
};

export type PostWithGame = Post & {
  game_title: string | null;
  game_thumbnail_url: string | null;
};

type PostRow = {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  game_id: number | null;
  created_at: string;
};

const selectColumns = `
  id, slug, title, content, excerpt, game_id, created_at
`;

function mapPost(row: PostRow): Post {
  return { ...row, game_id: row.game_id ?? null };
}

export function listPosts(): Post[] {
  const rows = db
    .prepare(`SELECT ${selectColumns} FROM posts ORDER BY created_at DESC`)
    .all() as PostRow[];
  return rows.map(mapPost);
}

export function listPostsWithGame(): PostWithGame[] {
  const rows = db
    .prepare(
      `SELECT p.id, p.slug, p.title, p.content, p.excerpt, p.game_id, p.created_at,
              g.title AS game_title, g.thumbnail_url AS game_thumbnail_url
       FROM posts p
       LEFT JOIN games g ON g.id = p.game_id
       ORDER BY p.created_at DESC`
    )
    .all() as (PostRow & {
    game_title: string | null;
    game_thumbnail_url: string | null;
  })[];
  return rows.map((row) => ({
    ...mapPost(row),
    game_title: row.game_title ?? null,
    game_thumbnail_url: row.game_thumbnail_url ?? null,
  }));
}

export function getPostBySlug(slug: string): PostWithGame | null {
  const row = db
    .prepare(
      `SELECT p.id, p.slug, p.title, p.content, p.excerpt, p.game_id, p.created_at,
              g.title AS game_title, g.thumbnail_url AS game_thumbnail_url
       FROM posts p
       LEFT JOIN games g ON g.id = p.game_id
       WHERE p.slug = ?`
    )
    .get(slug) as
    | (PostRow & { game_title: string | null; game_thumbnail_url: string | null })
    | undefined;
  if (!row) return null;
  return {
    ...mapPost(row),
    game_title: row.game_title ?? null,
    game_thumbnail_url: row.game_thumbnail_url ?? null,
  };
}

export function getPost(id: number): Post | null {
  const row = db.prepare(`SELECT ${selectColumns} FROM posts WHERE id = ?`).get(id) as
    | PostRow
    | undefined;
  return row ? mapPost(row) : null;
}

export function createPost(data: {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  game_id: number | null;
}): Post {
  const info = db
    .prepare(
      `INSERT INTO posts (slug, title, content, excerpt, game_id)
       VALUES (@slug, @title, @content, @excerpt, @game_id)`
    )
    .run({
      slug: data.slug,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      game_id: data.game_id,
    });
  return getPost(info.lastInsertRowid as number)!;
}

export function updatePost(
  id: number,
  data: Partial<{
    slug: string;
    title: string;
    content: string;
    excerpt: string;
    game_id: number | null;
  }>
): Post | null {
  const current = getPost(id);
  if (!current) return null;

  db.prepare(
    `UPDATE posts SET slug = @slug, title = @title, content = @content,
     excerpt = @excerpt, game_id = @game_id WHERE id = @id`
  ).run({
    id,
    slug: data.slug ?? current.slug,
    title: data.title ?? current.title,
    content: data.content ?? current.content,
    excerpt: data.excerpt ?? current.excerpt,
    game_id: data.game_id ?? current.game_id,
  });
  return getPost(id);
}

export function deletePost(id: number): boolean {
  const info = db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  return info.changes > 0;
}

export function slugExists(slug: string, excludeId?: number): boolean {
  const row = db
    .prepare("SELECT id FROM posts WHERE slug = ? AND id != ?")
    .get(slug, excludeId ?? -1);
  return Boolean(row);
}

export function getPostGame(post: Post): ReturnType<typeof getGame> {
  if (post.game_id == null) return null;
  return getGame(post.game_id);
}

export function parsePostDate(createdAt: string): Date {
  return new Date(createdAt.replace(" ", "T").replace("Z", "") + "Z");
}

export function formatPostDate(createdAt: string): string {
  const d = parsePostDate(createdAt);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}