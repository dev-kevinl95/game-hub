import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { createZipUpload } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!verifyToken(auth?.startsWith("Bearer ") ? auth.slice(7) : null)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { zipPath, uploadUrl } = await createZipUpload();
    return Response.json({ zipPath, uploadUrl }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Error al generar la subida" }, { status: 500 });
  }
}