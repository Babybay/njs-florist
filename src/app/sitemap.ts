import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { blogPosts } from "@/content/blog/posts";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/blog",
    "/custom",
    "/track",
  ].map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: "weekly",
  }));

  const blog: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
  }));

  let products: MetadataRoute.Sitemap = [];
  let categories: MetadataRoute.Sitemap = [];
  try {
    const [activeProducts, activeCategories] = await Promise.all([
      db.product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
      }),
      db.category.findMany({ select: { slug: true } }),
    ]);
    products = activeProducts.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
    }));
    categories = activeCategories.map((c) => ({
      url: `${base}/shop/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
    }));
  } catch (err) {
    console.error("sitemap: db lookup failed", err);
  }

  return [...staticRoutes, ...categories, ...products, ...blog];
}
