"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import type { StoreProduct } from "@/server/services/catalog.service";

const EASE = [0.22, 0.61, 0.36, 1] as const;

export function BestSellersClient({ products }: { products: StoreProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="relative bg-[color:var(--background)]">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pt-24">
        {/* ── Editorial section header ──────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-16 grid grid-cols-12 items-end gap-6 border-b border-[color:var(--rule)] pb-8"
        >
          <div className="col-span-12 flex items-center gap-3 lg:col-span-3">
            <span aria-hidden className="block h-px w-9 bg-[color:var(--ink)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[color:var(--ink-soft)]">
              Showcase Nº 01
            </span>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <h2 className="nf-display text-[2.75rem] leading-[1] text-[color:var(--ink)] sm:text-[3.25rem] lg:text-[3.75rem]">
              <span className="font-normal italic">Recently</span> in studio
            </h2>
          </div>
          <div className="col-span-12 flex items-center justify-start gap-3 lg:col-span-3 lg:justify-end">
            <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[color:var(--ink-muted)]">
              dirangkai pekan ini
            </span>
            <span aria-hidden className="block h-px w-9 bg-[color:var(--rule-strong)]" />
          </div>
        </motion.header>

        {/* ── Product grid (2/4 col, portrait cards) ────────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
          }}
          className="grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-6 lg:grid-cols-4 lg:gap-y-14"
        >
          {products.map((product, i) => (
            <BestSellerCard
              key={product.id}
              product={product}
              index={i}
              highlight={i === 1}
            />
          ))}
        </motion.div>

        {/* ── CTA cluster with fleuron divider ──────────────────────── */}
        <div className="mt-20 flex flex-col items-center gap-7">
          <div aria-hidden className="flex items-center gap-4">
            <span className="block h-px w-14 bg-[color:var(--rule-strong)] sm:w-24" />
            <span className="nf-display text-[18px] italic leading-none text-[color:var(--ink-muted)]">
              ✿
            </span>
            <span className="block h-px w-14 bg-[color:var(--rule-strong)] sm:w-24" />
          </div>
          <MagneticButton href="/shop">
            Jelajahi semua koleksi <span aria-hidden className="ml-3">→</span>
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}

function BestSellerCard({
  product,
  index,
  highlight,
}: {
  product: StoreProduct;
  index: number;
  highlight?: boolean;
}) {
  const reduced = useReducedMotion();
  const lowestPriceAdjust = product.variants.length
    ? Math.min(...product.variants.map((v) => v.priceAdjust))
    : 0;
  const lowestPrice = product.basePrice + lowestPriceAdjust;
  const hero = product.images[0];
  const ordinal = String(index + 1).padStart(2, "0");

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reduced ? 0 : 28 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
      }}
    >
      <Link href={`/product/${product.slug}`} className="group block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[color:var(--blush)]">
          {hero ? (
            <Image
              src={hero.url}
              alt={hero.altText ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
            />
          ) : null}

          {/* Best-seller chip — only on the highlighted card */}
          {highlight ? (
            <span className="absolute left-3 top-3 z-10 bg-[color:var(--ink)] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-[color:var(--cream)] shadow-[0_2px_10px_rgba(0,0,0,0.18)]">
              Best seller
            </span>
          ) : null}

          {/* Hover affordance — small circular arrow that slides in */}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-3 right-3 z-10 flex h-10 w-10 translate-y-3 items-center justify-center rounded-full bg-[color:var(--cream)] text-[color:var(--ink)] opacity-0 shadow-[0_6px_22px_rgba(0,0,0,0.18)] transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100"
          >
            →
          </span>
        </div>

        {/* Editorial metadata row — ordinal + hairline rule */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[10px] font-semibold tracking-[0.32em] text-[color:var(--ink-muted)]">
            {ordinal}
          </span>
          <span
            aria-hidden
            className="block h-px flex-1 bg-[color:var(--rule)] transition-colors duration-500 group-hover:bg-[color:var(--ink)]"
          />
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-3">
          <h3 className="text-[13px] font-semibold text-[color:var(--ink)] transition-colors group-hover:text-[color:var(--rose-deep)]">
            {product.name}
          </h3>
          <p className="nf-display text-[14px] italic leading-none text-[color:var(--ink-soft)]">
            Rp {Intl.NumberFormat("id-ID").format(lowestPrice)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

/* Magnetic button — pointer within ~110px radius pulls the button toward the
   cursor with a damped spring, like Linear & Vercel CTAs. */
function MagneticButton({ href, children }: { href: string; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  function onMove(event: React.MouseEvent<HTMLAnchorElement>) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const distance = Math.hypot(dx, dy);
    const radius = 110;
    if (distance > radius) {
      x.set(0);
      y.set(0);
      return;
    }
    const strength = 1 - distance / radius;
    x.set(dx * strength * 0.35);
    y.set(dy * strength * 0.35);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className="nf-btn nf-btn--outline"
    >
      {children}
    </motion.a>
  );
}
