import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { listPosts, getPostBySlug, formatPostDate } from "@/lib/posts";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await listPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt || post.content.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.game_thumbnail_url ? [post.game_thumbnail_url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const gameUrl = post.game_id != null ? `/game/${post.game_id}` : null;

  return (
    <div className="page">
      <Link href="/blog" className="back-link">
        ← Volver al blog
      </Link>

      <article className="post">
        <header className="post-header">
          <time className="post-date">
            {formatPostDate(post.created_at)}
          </time>
          <h1 className="post-title">{post.title}</h1>
        </header>

        <div className="post-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {gameUrl && (
          <div className="post-footer">
            <p>
              {post.game_title ? `¿Quieres probar ${post.game_title}?` : "¿Quieres jugarlo?"}
            </p>
            <Link href={gameUrl} className="post-play-btn">
              Jugar ahora
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}