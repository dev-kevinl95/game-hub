import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyToken } from "@/lib/auth";
import { getGame, updateGame, deleteGame } from "@/lib/games";
import { sb } from "@/lib/db";
import {
  storeGameZipFromStorage,
  saveImage,
  removeGameFolder,
  removeGameImages,
  folderNameFromUrl,
  UploadError,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/games/[id]">
) {
  const auth = request.headers.get("authorization");
  if (!verifyToken(auth?.startsWith("Bearer ") ? auth.slice(7) : null)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  const current = await getGame(numId);
  if (!current) {
    return Response.json({ error: "Juego no encontrado" }, { status: 404 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return Response.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const title = (form.get("title") as string)?.trim();
  const description = (form.get("description") as string)?.trim();
  const category = (form.get("category") as string)?.trim();
  const featured = form.get("featured") === "on" ? 1 : 0;
  const tagsRaw = (form.get("tags") as string)?.trim() ?? "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!title) {
    return Response.json({ error: "El título es obligatorio" }, { status: 400 });
  }

  const zipPath = (form.get("zipPath") as string)?.trim() ?? "";

  try {
    await updateGame(numId, {
      title,
      description,
      category,
      tags,
      featured,
    });

    if (zipPath && zipPath.startsWith("zips/") && zipPath.endsWith(".zip")) {
      const stored = await storeGameZipFromStorage(zipPath);
      await removeGameFolder(folderNameFromUrl(current.game_url));
      await sb.from("games").update({ game_url: stored.gameUrl }).eq("id", numId);
    }

    const thumbnailFile = form.get("thumbnail") as File | null;
    const bannerFile = (form.get("banner") as File | null) ?? null;
    if (thumbnailFile) {
      const url = await saveImage(numId, "thumbnail", thumbnailFile);
      if (url) await sb.from("games").update({ thumbnail_url: url }).eq("id", numId);
    }
    if (bannerFile) {
      const url = await saveImage(numId, "banner", bannerFile);
      if (url) await sb.from("games").update({ banner_url: url }).eq("id", numId);
    }

    revalidatePath("/");
    revalidatePath("/game/" + numId);
    revalidatePath("/admin");
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof UploadError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/games/[id]">
) {
  const auth = request.headers.get("authorization");
  if (!verifyToken(auth?.startsWith("Bearer ") ? auth.slice(7) : null)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  const current = await getGame(numId);
  if (!current) {
    return Response.json({ error: "Juego no encontrado" }, { status: 404 });
  }

  const deleted = await deleteGame(numId);
  if (deleted) {
    await removeGameFolder(folderNameFromUrl(current.game_url));
    await removeGameImages(numId);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return Response.json({ ok: true });
}