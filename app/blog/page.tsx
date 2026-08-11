import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listPostsWithGame, formatPostDate } from "@/lib/posts";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "El blog de Game Developer: descubre cómo fueron creados mis videojuegos, diseños y desarrollo.",
};

export default async function BlogPage() {
  const posts = await listPostsWithGame();

  return (
    <div className="container">
      <section className="hero">
        <h1 className="hero-title">Blog</h1>
        <p className="hero-subtitle">
          Historias, procesos y diseño de mis videojuegos.
        </p>
      </section>

      {posts.length === 0 ? (
        <p className="empty">Todavía no hay artículos publicados.</p>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="post-card"
            >
              <div className="post-card-cover">
                {post.game_thumbnail_url ? (
                  <Image
                    src={post.game_thumbnail_url}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="card-image"
                    unoptimized
                  />
                ) : (
                  <div className="game-card-placeholder">Sin imagen</div>
                )}
              </div>
              <div className="post-card-body">
                <time className="post-date">{formatPostDate(post.created_at)}</time>
                <h2 className="post-card-title">{post.title}</h2>
                <p className="post-card-excerpt">
                  {post.excerpt || post.content.slice(0, 140) + "…"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}