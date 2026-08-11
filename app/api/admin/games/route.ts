import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyToken } from "@/lib/auth";
import { createGame } from "@/lib/games";
import { sb } from "@/lib/db";
import { storeGameZip, saveImage, UploadError } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!verifyToken(auth?.startsWith("Bearer ") ? auth.slice(7) : null)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return Response.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const title = (form.get("title") as string)?.trim();
  const description = (form.get("description") as string)?.trim() ?? "";
  const category = (form.get("category") as string)?.trim() ?? "Otros";
  const featured = form.get("featured") === "on" ? 1 : 0;
  const tagsRaw = (form.get("tags") as string)?.trim() ?? "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const gameFile = form.get("game") as File | null;
  const thumbnailFile = form.get("thumbnail") as File | null;
  const bannerFile = (form.get("banner") as File | null) ?? null;

  if (!title) {
    return Response.json({ error: "El título es obligatorio" }, { status: 400 });
  }
  if (!gameFile || gameFile.size === 0) {
    return Response.json({ error: "Debes subir el archivo .zip del juego" }, { status: 400 });
  }

  try {
    const stored = await storeGameZip(gameFile);
    const game = await createGame({
      title,
      description,
      category,
      tags,
      game_url: stored.gameUrl,
      thumbnail_url: null,
      banner_url: null,
      featured,
    });

    const thumbnailUrl = await saveImage(game.id, "thumbnail", thumbnailFile);
    const bannerUrl = await saveImage(game.id, "banner", bannerFile);
    if (thumbnailUrl) {
      await sb.from("games").update({ thumbnail_url: thumbnailUrl }).eq("id", game.id);
    }
    if (bannerUrl) {
      await sb.from("games").update({ banner_url: bannerUrl }).eq("id", game.id);
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return Response.json({ ok: true, game }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return Response.json({ error: "Error interno al crear el juego" }, { status: 500 });
  }
}