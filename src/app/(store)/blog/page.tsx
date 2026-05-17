import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageKicker, PageTitle } from "@/components/ui/store-ui";
import { blogPosts } from "@/content/blog/posts";

export const metadata = {
  title: "Jurnal",
  description: "Tips dan inspirasi seputar bunga, dari tim njs Florist.",
};

export default function BlogIndexPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <PageKicker>Jurnal</PageKicker>
        <PageTitle>Cerita & tips dari florist kami</PageTitle>

        <ul className="mt-10 grid gap-4">
          {blogPosts.map((post) => (
            <li
              key={post.slug}
              className="rounded-md border border-stone-200 bg-white p-6 transition hover:border-black"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/55">
                {new Date(post.date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {" · "}
                {post.author}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-black">
                <Link href={`/blog/${post.slug}`} className="hover:underline underline-offset-4">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-stone-600">{post.description}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-3 inline-block text-sm font-semibold uppercase tracking-[0.16em] text-black underline-offset-4 hover:underline"
              >
                Baca selengkapnya →
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
