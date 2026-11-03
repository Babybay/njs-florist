import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CatalogView } from "@/components/catalog/catalog-view";
import { applyCatalogFilters, parseCatalogParams } from "@/lib/catalog-filter";
import { listActiveProducts, listCategories } from "@/server/services/catalog.service";

export const metadata = {
  title: "Koleksi Buket Bunga & Flower Box",
  description: "Lihat pilihan buket bunga dan flower box NJS Projects. Bandingkan rangkaian, pilih sesuai anggaran, atau ajukan ide custom untuk momen Anda di Bali.",
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
      <main id="main-content" className="bg-[color:var(--background)]">
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
