import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyToken } from "@/lib/auth";
import { listPosts, createPost, slugExists } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!verifyToken(auth?.startsWith("Bearer ") ? auth.slice(7) : null)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  return Response.json({ posts: await listPosts() });
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!verifyToken(auth?.startsWith("Bearer ") ? auth.slice(7) : null)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const b = body as {
    slug?: unknown;
    title?: unknown;
    content?: unknown;
    excerpt?: unknown;
    game_id?: unknown;
  };

  const slug = typeof b.slug === "string" ? b.slug.trim() : "";
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const content = typeof b.content === "string" ? b.content : "";
  const excerpt = typeof b.excerpt === "string" ? b.excerpt.trim() : "";
  const game_id =
    b.game_id == null || b.game_id === "" || b.game_id === 0
      ? null
      : Number(b.game_id);

  if (!title) {
    return Response.json({ error: "El título es obligatorio" }, { status: 400 });
  }
  if (!slug) {
    return Response.json({ error: "El slug es obligatorio" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return Response.json(
      { error: "El slug solo puede contener minúsculas, números y guiones" },
      { status: 400 }
    );
  }
  if (await slugExists(slug)) {
    return Response.json({ error: "El slug ya está en uso" }, { status: 409 });
  }
  if (Number.isNaN(game_id)) {
    return Response.json({ error: "game_id inválido" }, { status: 400 });
  }

  const post = await createPost({
    slug,
    title,
    content,
    excerpt,
    game_id,
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin");
  return Response.json({ ok: true, post }, { status: 201 });
}