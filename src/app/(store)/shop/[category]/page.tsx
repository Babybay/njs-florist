import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CatalogView } from "@/components/catalog/catalog-view";
import { applyCatalogFilters, parseCatalogParams } from "@/lib/catalog-filter";
import {
  getCategoryBySlug,
  listCategories,
  listProductsByCategorySlug,
} from "@/server/services/catalog.service";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  return {
    title: category?.name ?? "Kategori",
    description: category?.description ?? undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
    min?: string;
    max?: string;
  }>;
}) {
  const [{ category: categorySlug }, raw] = await Promise.all([params, searchParams]);
  const parsed = parseCatalogParams(raw);

  const [category, allCategories, categoryProducts] = await Promise.all([
    getCategoryBySlug(categorySlug),
    listCategories(),
    listProductsByCategorySlug(categorySlug),
  ]);
  if (!category) notFound();

  const products = applyCatalogFilters(categoryProducts, parsed);

  return (
    <>
      <SiteHeader />
      <main className="bg-[color:var(--background)]">
        <CatalogView
          categories={allCategories}
          activeSlug={category.slug}
          activeCategoryName={category.name}
          products={products}
          totalCount={categoryProducts.length}
          filters={{
            q: parsed.q,
            sort: parsed.sort,
            min: parsed.min,
            max: parsed.max,
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
