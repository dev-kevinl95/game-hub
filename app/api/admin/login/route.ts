import { NextRequest } from "next/server";
import { authenticate, signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || !authenticate(password)) {
    return Response.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  return Response.json({ token: signToken() });
}