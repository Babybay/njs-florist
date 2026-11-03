import Image from "next/image";
import Link from "next/link";
import { formatIDR } from "@/lib/money";
import type { StoreProduct } from "@/server/services/catalog.service";

export function ProductCard({ product, variant = "arch" }: { product: StoreProduct; variant?: "arch" | "square" }) {
  const price = product.basePrice + (product.variants.length ? Math.min(...product.variants.map((item) => item.priceAdjust)) : 0);
  const image = product.images[0];
  const isNew = Date.now() - new Date(product.createdAt).getTime() <= 14 * 24 * 60 * 60 * 1000;
  return (
    <Link href={`/product/${product.slug}`} className={`store-product store-product--${variant}`}>
      <div className="store-product-photo">
        {image ? <Image src={image.url} alt={image.altText ?? product.name} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 40vw, 300px" className="object-cover" /> : <span className="store-photo-empty">{product.name}</span>}
        {isNew ? <span className="store-product-badge">Baru</span> : null}
        <span className="store-product-view" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></span>
      </div>
      <div className="store-product-details">
        <p className="store-product-category">{product.category.name}</p>
        <h3>{product.name}</h3>
        <p className="store-product-price"><span>Mulai </span>{formatIDR(price)}</p>
      </div>
    </Link>
  );
}
