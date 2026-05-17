import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CatalogView } from "@/components/catalog/catalog-view";
import { applyCatalogFilters, parseCatalogParams } from "@/lib/catalog-filter";
import { listActiveProducts, listCategories } from "@/server/services/catalog.service";

export const metadata = {
  title: "Katalog",
  description: "Pilih bunga segar, flower box, dan rangkaian custom njs Florist.",
};

export const revalidate = 60;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    min?: string;
    max?: string;
  }>;
}) {
  const raw = await searchParams;
  const params = parseCatalogParams(raw);

  const [categories, allProducts] = await Promise.all([
    listCategories(),
    listActiveProducts(),
  ]);

  const products = applyCatalogFilters(allProducts, params);

  return (
    <>
      <SiteHeader />
      <main className="bg-[color:var(--background)]">
        <CatalogView
          categories={categories}
          activeSlug={null}
          activeCategoryName={null}
          products={products}
          totalCount={allProducts.length}
          filters={{
            q: params.q,
            sort: params.sort,
            min: params.min,
            max: params.max,
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
