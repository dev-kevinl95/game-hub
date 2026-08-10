import Link from "next/link";
import Image from "next/image";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Faq } from "@/components/Faq";
import { listGames } from "@/lib/games";

export const revalidate = 60;

export default function Home() {
  const games = listGames();

  return (
    <div className="container">
      <ProfileHeader />

      <section className="hero">
        <h1 className="hero-title">Selecciona un juego</h1>
        <p className="hero-subtitle">
          Elige un título y empieza a jugar al instante, sin descargas ni
          instalaciones, desde tu navegador.
        </p>
      </section>

      {games.length === 0 ? (
        <p className="empty">Aún no hay juegos publicados. ¡Vuelve pronto para ver novedades!</p>
      ) : (
        <div className="games-grid">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/game/${game.id}`}
              className="game-card"
            >
              <div className="game-card-cover">
                {game.thumbnail_url ? (
                  <Image
                    src={game.thumbnail_url}
                    alt={game.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="card-image"
                    unoptimized
                  />
                ) : (
                  <div className="game-card-placeholder">Sin imagen</div>
                )}
              </div>
              <div className="game-card-body">
                <h2 className="game-card-title">{game.title}</h2>
                <p className="game-card-meta">
                  {game.category} · {game.plays.toLocaleString()} partidas
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Faq />
    </div>
  );
}