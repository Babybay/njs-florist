import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { blogPosts, findPostBySlug } from "@/content/blog/posts";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = findPostBySlug(slug);
  if (!post) return { title: "Artikel tidak ditemukan" };
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = findPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="text-sm font-semibold uppercase tracking-[0.18em] text-black underline-offset-4 hover:underline"
        >
          ← Kembali ke jurnal
        </Link>
        <article className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/55">
            {new Date(post.date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" · "}
            {post.author}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-black">{post.title}</h1>
          <p className="mt-4 text-lg leading-7 text-black/75">{post.description}</p>
          <div className="prose mt-8 max-w-none text-black [&_a]:font-semibold [&_a]:text-black [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-black [&_li]:mt-1 [&_ol]:mt-4 [&_ol]:list-inside [&_ol]:list-decimal [&_p]:mt-4 [&_p]:leading-7 [&_ul]:mt-4 [&_ul]:list-inside [&_ul]:list-disc">
            {post.body}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
