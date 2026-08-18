import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "./GamePlayer";
import { listGames, getGame } from "@/lib/games";
import { folderNameFromUrl } from "@/lib/storage";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const games = await listGames();
  return games.map((g) => ({ id: String(g.id) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/game/[id]">): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(Number(id));
  if (!game) return {};
  return {
    title: game.title,
    description: game.description || `Juega ${game.title} gratis en tu navegador.`,
    openGraph: {
      title: game.title,
      description: game.description || undefined,
      images: game.thumbnail_url ? [game.thumbnail_url] : undefined,
    },
  };
}

export default async function GamePage({ params }: PageProps<"/game/[id]">) {
  const { id } = await params;
  const game = await getGame(Number(id));
  if (!game) notFound();

  return (
    <div className="page">
      <GamePlayer
        gameId={game.id}
        playUrl={`/api/play/${folderNameFromUrl(game.game_url)}/index.html`}
        thumbnail={game.thumbnail_url}
        title={game.title}
      />
      <h1 className="game-title">{game.title}</h1>
      <p className="game-meta">
        {game.category} · {game.plays.toLocaleString()} partidas
      </p>


      <div className="info-card">
        <h2>Descripción</h2>
        <p className="info-text">
          {game.description || "Sin descripción."}
        </p>
        {game.tags.length > 0 && (
          <div className="tags">
            {game.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}