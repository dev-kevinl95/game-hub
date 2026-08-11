import { sb } from "./db";
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

type PostRowWithGame = PostRow & {
  games: { title: string | null; thumbnail_url: string | null } | null;
};

const selectColumns = "id, slug, title, content, excerpt, game_id, created_at";

function mapPost(row: PostRow): Post {
  return { ...row, game_id: row.game_id ?? null };
}

function mapPostWithGame(row: PostRow & { game_title: string | null; game_thumbnail_url: string | null }): PostWithGame {
  return {
    ...mapPost(row),
    game_title: row.game_title ?? null,
    game_thumbnail_url: row.game_thumbnail_url ?? null,
  };
}

export async function listPosts(): Promise<Post[]> {
  const { data } = await sb
    .from("posts")
    .select(selectColumns)
    .order("created_at", { ascending: false });
  return ((data ?? []) as PostRow[]).map(mapPost);
}

export async function listPostsWithGame(): Promise<PostWithGame[]> {
  const { data } = await sb
    .from("posts")
    .select(selectColumns + ", games (title, thumbnail_url)")
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as PostRowWithGame[]).map((row) =>
    mapPostWithGame({
      ...row,
      game_title: row.games?.title ?? null,
      game_thumbnail_url: row.games?.thumbnail_url ?? null,
    })
  );
}

export async function getPostBySlug(slug: string): Promise<PostWithGame | null> {
  const { data } = await sb
    .from("posts")
    .select(selectColumns + ", games (title, thumbnail_url)")
    .eq("slug", slug)
    .maybeSingle();
  const row = data as PostRowWithGame | null;
  if (!row) return null;
  return mapPostWithGame({
    ...row,
    game_title: row.games?.title ?? null,
    game_thumbnail_url: row.games?.thumbnail_url ?? null,
  });
}

export async function getPost(id: number): Promise<Post | null> {
  const { data } = await sb
    .from("posts")
    .select(selectColumns)
    .eq("id", id)
    .maybeSingle();
  const row = data as PostRow | null;
  return row ? mapPost(row) : null;
}

export async function createPost(data: {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  game_id: number | null;
}): Promise<Post> {
  const { data: row, error } = await sb
    .from("posts")
    .insert({
      slug: data.slug,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      game_id: data.game_id,
    })
    .select(selectColumns)
    .single();
  if (error) throw error;
  return mapPost(row as PostRow);
}

export async function updatePost(
  id: number,
  data: Partial<{
    slug: string;
    title: string;
    content: string;
    excerpt: string;
    game_id: number | null;
  }>
): Promise<Post | null> {
  const current = await getPost(id);
  if (!current) return null;

  const { data: row, error } = await sb
    .from("posts")
    .update({
      slug: data.slug ?? current.slug,
      title: data.title ?? current.title,
      content: data.content ?? current.content,
      excerpt: data.excerpt ?? current.excerpt,
      game_id: data.game_id ?? current.game_id,
    })
    .eq("id", id)
    .select(selectColumns)
    .single();
  if (error) throw error;
  return mapPost(row as PostRow);
}

export async function deletePost(id: number): Promise<boolean> {
  const { data, error } = await sb
    .from("posts")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

export async function slugExists(slug: string, excludeId?: number): Promise<boolean> {
  let query = sb.from("posts").select("id").eq("slug", slug);
  if (excludeId != null) {
    query = query.neq("id", excludeId);
  }
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export async function getPostGame(post: Post): Promise<ReturnType<typeof getGame>> {
  if (post.game_id == null) return null;
  return getGame(post.game_id);
}

export function parsePostDate(createdAt: string): Date {
  if (createdAt.includes("T") || createdAt.includes("+")) {
    return new Date(createdAt);
  }
  return new Date(createdAt.replace(" ", "T") + "Z");
}

export function formatPostDate(createdAt: string): string {
  const d = parsePostDate(createdAt);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}