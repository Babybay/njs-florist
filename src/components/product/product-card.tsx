import Image from "next/image";
import Link from "next/link";
import { formatIDR } from "@/lib/money";
import type { StoreProduct } from "@/server/services/catalog.service";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function ProductCard({
  product,
  variant = "arch",
}: {
  product: StoreProduct;
  variant?: "arch" | "square";
}) {
  const lowestPriceAdjust = product.variants.length
    ? Math.min(...product.variants.map((variant) => variant.priceAdjust))
    : 0;
  const lowestPrice = product.basePrice + lowestPriceAdjust;
  const heroImage = product.images[0];
  const isNew =
    Date.now() - new Date(product.createdAt).getTime() <= FOURTEEN_DAYS_MS;

  if (variant === "square") {
    return (
      <Link
        href={`/product/${product.slug}`}
        className="group flex flex-col overflow-hidden rounded-[4px] border border-[color:var(--rule-strong)] bg-white shadow-[0_1px_2px_rgba(42,31,34,0.04)] transition duration-300 hover:-translate-y-[2px] hover:border-[color:var(--rose-deep)]/45 hover:shadow-[0_18px_36px_-22px_rgba(154,79,79,0.45)]"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-[color:var(--blush)]">
          {heroImage ? (
            <Image
              src={heroImage.url}
              alt={heroImage.altText ?? product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
            />
          ) : null}
          {isNew ? (
            <span className="absolute left-3 top-3 rounded-full bg-[color:var(--rose-deep)] px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.22em] text-[color:var(--cream)] shadow-[0_6px_14px_-6px_rgba(154,79,79,0.6)]">
              Baru
            </span>
          ) : null}
        </div>
        <div className="space-y-1.5 p-4">
          <p className="text-[10.5px] font-semibold uppercase leading-none tracking-[0.24em] text-[color:var(--ink-muted)]">
            {product.category.name}
          </p>
          <h3 className="nf-display line-clamp-2 text-[19px] leading-[1.2] text-[color:var(--ink)] transition-colors group-hover:text-[color:var(--rose-deep)]">
            {product.name}
          </h3>
          <p className="pt-1 text-[15px] font-semibold text-[color:var(--ink)]">
            <span className="mr-1 text-[10.5px] font-medium uppercase tracking-[0.16em] text-[color:var(--ink-muted)]">
              Mulai
            </span>
            {formatIDR(lowestPrice)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col"
    >
      <div className="nf-arch relative aspect-[3/4] w-full overflow-hidden bg-[color:var(--blush)] ring-1 ring-[color:var(--rule-strong)] transition duration-500 group-hover:ring-[color:var(--rose-deep)]/50 group-hover:shadow-[0_22px_42px_-26px_rgba(154,79,79,0.55)]">
        {heroImage ? (
          <Image
            src={heroImage.url}
            alt={heroImage.altText ?? product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
          />
        ) : null}
        {isNew ? (
          <span className="absolute left-4 top-4 rounded-full bg-[color:var(--rose-deep)] px-3 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.22em] text-[color:var(--cream)] shadow-[0_6px_14px_-6px_rgba(154,79,79,0.6)]">
            Baru
          </span>
        ) : null}
      </div>
      <div className="mt-5 space-y-1.5">
        <p className="text-[10.5px] font-semibold uppercase leading-none tracking-[0.26em] text-[color:var(--ink-muted)]">
          {product.category.name}
        </p>
        <h3 className="nf-display line-clamp-2 text-[20px] leading-[1.15] text-[color:var(--ink)] transition-colors group-hover:text-[color:var(--rose-deep)]">
          {product.name}
        </h3>
        <p className="pt-1 text-[15px] font-semibold text-[color:var(--ink)]">
          <span className="mr-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
            Mulai
          </span>
          {formatIDR(lowestPrice)}
        </p>
      </div>
    </Link>
  );
}
