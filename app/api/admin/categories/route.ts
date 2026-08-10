import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { listCategories } from "@/lib/games";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(listCategories());
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
    const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
    return Response.json({ id: info.lastInsertRowid, name }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Esa categoría ya existe" },
      { status: 409 }
    );
  }
}