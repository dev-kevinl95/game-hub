import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { listCategories } from "@/lib/games";
import { sb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listCategories());
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!verifyToken(auth?.startsWith("Bearer ") ? auth.slice(7) : null)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = (body?.name as string)?.trim();
  if (!name) {
    return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  try {
    const { data, error } = await sb
      .from("categories")
      .insert({ name })
      .select("id")
      .single();
    if (error) throw error;
    return Response.json({ id: data.id, name }, { status: 201 });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return Response.json(
        { error: "Esa categoría ya existe" },
        { status: 409 }
      );
    }
    console.error(err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}