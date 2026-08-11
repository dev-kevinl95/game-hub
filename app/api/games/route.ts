import { listGames } from "@/lib/games";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listGames());
}