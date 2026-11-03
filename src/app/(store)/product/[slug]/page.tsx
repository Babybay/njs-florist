import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatIDR } from "@/lib/money";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AddToCartForm } from "@/components/product/add-to-cart-form";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { Breadcrumb } from "@/components/ui/store-ui";
import {
  getProductBySlug,
  listProductsByCategorySlug,
} from "@/server/services/catalog.service";
import { calculateVariantAvailabilityMap } from "@/server/services/stock.service";
import { getSettingNumber, SETTING_KEYS } from "@/server/services/settings.service";
import { isUiPreview } from "@/lib/ui-preview";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produk tidak ditemukan" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      type: "website",
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [availabilityMap, categoryProducts, cutoffHour] = await Promise.all([
    isUiPreview ? Promise.resolve(new Map<string, number>()) : calculateVariantAvailabilityMap(product.variants.map((v) => v.id)),
    listProductsByCategorySlug(product.category.slug),
    getSettingNumber(SETTING_KEYS.SAME_DAY_CUTOFF_HOUR),
  ]);

  const variantAvailabilities = product.variants.map((variant) => ({
    ...variant,
    availability: availabilityMap.get(variant.id) ?? 0,
  }));

  const lowestPriceAdjust = product.variants.length
    ? Math.min(...product.variants.map((variant) => variant.priceAdjust))
    : 0;
  const lowestPrice = product.basePrice + lowestPriceAdjust;
  const totalInStock = variantAvailabilities.reduce(
    (sum, v) => sum + Math.max(0, v.availability),
    0,
  );

  const related = categoryProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="store-product-page bg-[color:var(--background)]">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Beranda", href: "/" },
              { label: "Katalog", href: "/shop" },
              { label: product.category.name, href: `/shop/${product.category.slug}` },
              { label: product.name },
            ]}
          />

          <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <ProductGallery images={product.images} productName={product.name} />

            <section className="lg:sticky lg:top-[100px] lg:self-start">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[color:var(--ink-muted)]">
                {product.category.name}
              </p>
              <h1 className="nf-display mt-4 text-[2.5rem] leading-[1.02] text-[color:var(--ink)] sm:text-[3.25rem]">
                {product.name}
              </h1>

              <div className="mt-6 flex flex-wrap items-baseline gap-3 border-b border-[color:var(--rule)] pb-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">
                  Mulai
                </p>
                <p className="text-[1.75rem] font-semibold leading-none text-[color:var(--ink)]">
                  {formatIDR(lowestPrice)}
                </p>
                <span
                  className={`ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                    totalInStock > 0 ? "text-emerald-700" : "text-[color:var(--ink-muted)]"
                  }`}
                >
                  {isUiPreview ? "Contoh produk" : totalInStock > 0 ? "Tersedia" : "Stok habis"}
                </span>
              </div>

              <p className="mt-6 max-w-prose text-[14px] leading-[1.85] text-[color:var(--ink-soft)]">
                {product.description}
              </p>

              {/* studio note */}
              <div className="mt-6 flex items-start gap-3 rounded-[3px] border border-[color:var(--rule)] bg-[color:var(--paper)] px-4 py-3.5 text-[12.5px] leading-[1.6] text-[color:var(--ink-soft)]">
                <span>
                  Dirangkai dengan tangan di studio kami di Bali.
                  {product.isSameDayEligible ? <> Pesan sebelum <strong className="font-semibold text-[color:var(--ink)]">{cutoffHour}.00 WITA</strong> untuk pickup hari ini, sesuai ketersediaan.</> : null}
                </span>
              </div>

              <div className="mt-8">
                {isUiPreview ? <div className="store-preview-note"><h2>Contoh rangkaian</h2><p>Anda sedang melihat katalog contoh. Pemesanan dan ketersediaan stok belum aktif di preview ini.</p><Link href="/shop" className="nf-btn nf-btn--secondary">Jelajahi koleksi</Link></div> : <AddToCartForm
                  productId={product.id}
                  basePrice={product.basePrice}
                  variants={variantAvailabilities.map((v) => ({
                    id: v.id,
                    name: v.name,
                    size: v.size,
                    wrapper: v.wrapper,
                    priceAdjust: v.priceAdjust,
                    availability: v.availability,
                  }))}
                  addons={product.addons.map(({ addon }) => ({
                    id: addon.id,
                    name: addon.name,
                    price: addon.price,
                  }))}
                />}
              </div>
            </section>
          </div>

          {related.length > 0 ? (
            <section className="mt-28">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[color:var(--rule)] pb-7">
                <div>
                  <h2 className="nf-display mt-3 text-[2rem] leading-[1.05] text-[color:var(--ink)] sm:text-[2.5rem]">
                    Lainnya di {product.category.name}
                  </h2>
                </div>
                <Link
                  href={`/shop/${product.category.slug}`}
                  className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--ink)] underline-offset-[6px] hover:underline"
                >
                  Lihat semua
                </Link>
              </div>
              <div className="store-related-grid mt-12">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} variant="square" />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
