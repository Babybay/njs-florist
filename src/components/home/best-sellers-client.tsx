import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import type { StoreProduct } from "@/server/services/catalog.service";

export function BestSellersClient({ products }: { products: StoreProduct[] }) {
  return (
    <section className="store-collection store-container" aria-labelledby="collection-title">
      <header className="store-section-heading">
        <h2 id="collection-title">Temukan buket Anda</h2>
        <Link href="/shop" className="store-text-link">Jelajahi semua rangkaian</Link>
      </header>
      {products.length > 0 ? <nav className="store-category-links" aria-label="Jelajahi kategori">
        <Link href="/shop">Semua rangkaian</Link>
        {Array.from(new Map(products.map((product) => [product.category.slug, product.category])).values()).map((category) => <Link key={category.slug} href={`/shop/${category.slug}`}>{category.name}</Link>)}
      </nav> : null}
      {products.length ? <div className="store-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="store-empty">Koleksi belum tersedia untuk ditampilkan. <Link href="/custom">Sampaikan ide rangkaian yang Anda inginkan.</Link></p>}
    </section>
  );
}
