import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyToken } from "@/lib/auth";
import { getPost, updatePost, deletePost, slugExists } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = request.headers.get("authorization");
  if (!verifyToken(auth?.startsWith("Bearer ") ? auth.slice(7) : null)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const postId = Number(id);
  const current = getPost(postId);
  if (!current) {
    return Response.json({ error: "Post no encontrado" }, { status: 404 });
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

  const slug =
    b.slug === undefined ? current.slug : typeof b.slug === "string" ? b.slug.trim() : "";
  const title =
    b.title === undefined
      ? current.title
      : typeof b.title === "string"
        ? b.title.trim()
        : "";
  const content =
    b.content === undefined
      ? current.content
      : typeof b.content === "string"
        ? b.content
        : "";
  const excerpt =
    b.excerpt === undefined
      ? current.excerpt
      : typeof b.excerpt === "string"
        ? b.excerpt.trim()
        : "";
  let gameId = current.game_id;
  if (b.game_id !== undefined) {
    gameId =
      b.game_id === null || b.game_id === "" || b.game_id === 0
        ? null
        : Number(b.game_id);
  }

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
  if (gameId !== null && Number.isNaN(gameId)) {
    return Response.json({ error: "game_id inválido" }, { status: 400 });
  }
  if (slug !== current.slug && slugExists(slug, current.id)) {
    return Response.json({ error: "El slug ya está en uso" }, { status: 409 });
  }

  const post = updatePost(current.id, { slug, title, content, excerpt, game_id: gameId });

  revalidatePath("/blog");
  revalidatePath(`/blog/${current.slug}`);
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin");
  return Response.json({ ok: true, post });
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = request.headers.get("authorization");
  if (!verifyToken(auth?.startsWith("Bearer ") ? auth.slice(7) : null)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const current = getPost(Number(id));
  if (!current) {
    return Response.json({ error: "Post no encontrado" }, { status: 404 });
  }

  deletePost(current.id);
  revalidatePath("/blog");
  revalidatePath(`/blog/${current.slug}`);
  revalidatePath("/admin");
  return Response.json({ ok: true });
}