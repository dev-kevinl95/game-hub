import { NextRequest } from "next/server";
import { getGame, incrementPlays } from "@/lib/games";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/games/[id]">
) {
  const { id } = await params;
  const game = await getGame(Number(id));
  if (!game) {
    return Response.json({ error: "Juego no encontrado" }, { status: 404 });
  }
  return Response.json(game);
}

export async function POST(
  _request: NextRequest,
  { params }: RouteContext<"/api/games/[id]">
) {
  const { id } = await params;
  const numId = Number(id);
  if (!(await getGame(numId))) {
    return Response.json({ error: "Juego no encontrado" }, { status: 404 });
  }
  await incrementPlays(numId);
  return Response.json({ ok: true });
}