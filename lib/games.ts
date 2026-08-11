import { sb } from "./db";

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

export async function listGames(): Promise<Game[]> {
  const { data } = await sb
    .from("games")
    .select("*")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapGame);
}

export async function getGame(id: number): Promise<Game | null> {
  const { data } = await sb
    .from("games")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapGame(data) : null;
}

export async function incrementPlays(id: number): Promise<void> {
  await sb.rpc("increment_plays", { game_id: id });
}

export async function createGame(
  data: Omit<Game, "id" | "created_at" | "plays" | "rating">
): Promise<Game> {
  const { data: row, error } = await sb
    .from("games")
    .insert({
      title: data.title,
      description: data.description,
      category: data.category,
      tags: JSON.stringify(data.tags),
      thumbnail_url: data.thumbnail_url,
      banner_url: data.banner_url,
      game_url: data.game_url,
      featured: data.featured,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapGame(row);
}

export async function updateGame(
  id: number,
  data: Partial<
    Pick<Game, "title" | "description" | "category" | "tags" | "featured">
  >
): Promise<Game | null> {
  const current = await getGame(id);
  if (!current) return null;

  const { data: row, error } = await sb
    .from("games")
    .update({
      title: data.title ?? current.title,
      description: data.description ?? current.description,
      category: data.category ?? current.category,
      tags: JSON.stringify(data.tags ?? current.tags),
      featured: data.featured ?? current.featured,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapGame(row);
}

export async function deleteGame(id: number): Promise<boolean> {
  const { data, error } = await sb
    .from("games")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await sb
    .from("categories")
    .select("id, name")
    .order("name");
  return (data ?? []) as Category[];
}