"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import type { StoreCategory, StoreProduct } from "@/server/services/catalog.service";
import { EmptyState } from "@/components/ui/store-ui";

export type CatalogFilters = {
  q: string;
  sort: "new" | "price-asc" | "price-desc";
  min: string;
  max: string;
};

export type CatalogViewProps = {
  categories: StoreCategory[];
  activeSlug: string | null;
  activeCategoryName: string | null;
  products: StoreProduct[];
  totalCount: number;
  filters: CatalogFilters;
};

function buildHref(base: string, filters: CatalogFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.sort && filters.sort !== "new") params.set("sort", filters.sort);
  if (filters.min) params.set("min", filters.min);
  if (filters.max) params.set("max", filters.max);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function CatalogView({
  categories,
  activeSlug,
  activeCategoryName,
  products,
  totalCount,
  filters,
}: CatalogViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const title = activeCategoryName ?? (filters.q ? `Hasil untuk "${filters.q}"` : "Semua rangkaian");
  const formAction = activeSlug ? `/shop/${activeSlug}` : "/shop";

  const hasFilters =
    Boolean(filters.q) || Boolean(filters.min) || Boolean(filters.max) || (filters.sort && filters.sort !== "new");

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      {/* heading row */}
      <div className="border-b border-[color:var(--rule)] pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[color:var(--ink-muted)]">
          Katalog
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <h1 className="nf-display text-[2.5rem] leading-[1] text-[color:var(--ink)] sm:text-[3.25rem] lg:text-[3.75rem]">
            {title}
          </h1>
          <div className="flex items-center gap-3">
            <SortSelect formAction={formAction} filters={filters} />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ink)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--ink)] transition hover:bg-[color:var(--ink)] hover:text-[color:var(--cream)] lg:hidden"
            >
              <span aria-hidden>☰</span> Filter
            </button>
          </div>
        </div>
        <p className="mt-4 text-[12.5px] uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
          {products.length}{products.length === totalCount ? "" : ` / ${totalCount}`} rangkaian
          {activeSlug ? <> · di {activeCategoryName}</> : null}
        </p>

        {hasFilters ? (
          <ActiveFilterChips filters={filters} activeSlug={activeSlug} />
        ) : null}
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
        {/* sidebar — desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-[92px] grid gap-9">
            <Sidebar
              categories={categories}
              activeSlug={activeSlug}
              filters={filters}
              formAction={formAction}
            />
          </div>
        </aside>

        {/* grid */}
        <div>
          {products.length === 0 ? (
            <EmptyState
              icon="✿"
              title="Tidak ada rangkaian yang cocok"
              description={
                hasFilters
                  ? "Coba ubah kata kunci atau range harga di sidebar. Atau hapus semua filter untuk melihat seluruh katalog."
                  : "Belum ada produk aktif. Cek lagi sebentar."
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} variant="square" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-[color:var(--ink)]/45 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-[color:var(--background)] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="nf-display text-3xl text-[color:var(--ink)]">Filter</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Tutup filter"
                className="grid h-9 w-9 place-items-center rounded-full text-[color:var(--ink)] hover:bg-[color:var(--blush)]"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-7 grid gap-9">
              <Sidebar
                categories={categories}
                activeSlug={activeSlug}
                filters={filters}
                formAction={formAction}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActiveFilterChips({
  filters,
  activeSlug,
}: {
  filters: CatalogFilters;
  activeSlug: string | null;
}) {
  const base = activeSlug ? `/shop/${activeSlug}` : "/shop";
  const chips: { label: string; href: string }[] = [];
  if (filters.q) {
    chips.push({
      label: `Cari: "${filters.q}"`,
      href: buildHref(base, { ...filters, q: "" }),
    });
  }
  if (filters.min || filters.max) {
    const range = `${filters.min ? `Rp ${formatThousands(filters.min)}` : "0"} – ${filters.max ? `Rp ${formatThousands(filters.max)}` : "∞"}`;
    chips.push({
      label: range,
      href: buildHref(base, { ...filters, min: "", max: "" }),
    });
  }
  if (filters.sort && filters.sort !== "new") {
    const label = filters.sort === "price-asc" ? "Harga ↑" : "Harga ↓";
    chips.push({
      label,
      href: buildHref(base, { ...filters, sort: "new" }),
    });
  }
  if (chips.length === 0) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <span className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">Filter aktif:</span>
      {chips.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="group inline-flex items-center gap-1.5 rounded-full border border-[color:var(--ink)] bg-[color:var(--paper)] px-3 py-1.5 text-[11.5px] font-medium text-[color:var(--ink)] transition hover:bg-[color:var(--ink)] hover:text-[color:var(--cream)]"
        >
          {c.label}
          <span aria-hidden className="transition-transform group-hover:rotate-90">×</span>
        </Link>
      ))}
    </div>
  );
}

function formatThousands(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("id-ID") : value;
}

function Sidebar({
  categories,
  activeSlug,
  filters,
  formAction,
  onNavigate,
}: {
  categories: StoreCategory[];
  activeSlug: string | null;
  filters: CatalogFilters;
  formAction: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <FilterGroup label="Cari">
        <form action={formAction} className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Bunga, buket…"
            className="h-10 w-full rounded-full border border-[color:var(--rule-strong)] bg-[color:var(--paper)] px-4 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)] focus:border-[color:var(--ink)] focus:outline-none"
          />
          {filters.sort && filters.sort !== "new" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
          {filters.min ? <input type="hidden" name="min" value={filters.min} /> : null}
          {filters.max ? <input type="hidden" name="max" value={filters.max} /> : null}
          <button
            type="submit"
            aria-label="Cari"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--ink)] text-[color:var(--cream)] transition hover:bg-[color:var(--ink-soft)]"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </form>
      </FilterGroup>

      <FilterGroup label="Kategori">
        <ul className="grid gap-0.5 text-[14px]">
          <CategoryRow
            href={buildHref("/shop", filters)}
            label="Semua"
            active={activeSlug === null}
            onNavigate={onNavigate}
          />
          {categories.map((c) => (
            <CategoryRow
              key={c.slug}
              href={buildHref(`/shop/${c.slug}`, filters)}
              label={c.name}
              active={c.slug === activeSlug}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup label="Harga (IDR)">
        <form action={formAction} className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
              <span>Min</span>
              <input
                type="number"
                name="min"
                min={0}
                step={50000}
                defaultValue={filters.min}
                placeholder="0"
                className="h-10 w-full rounded-[2px] border border-[color:var(--rule-strong)] bg-[color:var(--paper)] px-3 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)] focus:border-[color:var(--ink)] focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
              <span>Max</span>
              <input
                type="number"
                name="max"
                min={0}
                step={50000}
                defaultValue={filters.max}
                placeholder="∞"
                className="h-10 w-full rounded-[2px] border border-[color:var(--rule-strong)] bg-[color:var(--paper)] px-3 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)] focus:border-[color:var(--ink)] focus:outline-none"
              />
            </label>
          </div>
          {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
          {filters.sort && filters.sort !== "new" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
          <button type="submit" className="nf-btn nf-btn--outline !py-3 !text-[10.5px]">
            Terapkan
          </button>
        </form>
      </FilterGroup>

      {(filters.q || filters.min || filters.max || (filters.sort && filters.sort !== "new")) && (
        <Link
          href={activeSlug ? `/shop/${activeSlug}` : "/shop"}
          onClick={onNavigate}
          className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--ink-soft)] underline-offset-[6px] transition hover:text-[color:var(--ink)] hover:underline"
        >
          ✕ Hapus semua filter
        </Link>
      )}
    </>
  );
}

function CategoryRow({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center justify-between gap-2 border-l-2 py-2 pl-3 pr-2 transition ${
          active
            ? "border-[color:var(--ink)] font-medium text-[color:var(--ink)]"
            : "border-transparent text-[color:var(--ink-soft)] hover:border-[color:var(--ink)]/40 hover:text-[color:var(--ink)]"
        }`}
      >
        <span>{label}</span>
        <span
          aria-hidden
          className={`text-xs transition-transform ${
            active ? "translate-x-0 opacity-100" : "opacity-0 group-hover:translate-x-1 group-hover:opacity-70"
          }`}
        >
          →
        </span>
      </Link>
    </li>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--ink-muted)]">
        {label}
      </p>
      {children}
    </div>
  );
}

function SortSelect({ formAction, filters }: { formAction: string; filters: CatalogFilters }) {
  return (
    <form action={formAction} className="flex items-center gap-2">
      {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
      {filters.min ? <input type="hidden" name="min" value={filters.min} /> : null}
      {filters.max ? <input type="hidden" name="max" value={filters.max} /> : null}
      <label className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--ink-muted)] sm:inline">
        Urutkan
      </label>
      <div className="relative">
        <select
          name="sort"
          defaultValue={filters.sort}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="h-10 appearance-none rounded-full border border-[color:var(--rule-strong)] bg-[color:var(--paper)] pl-4 pr-9 text-sm text-[color:var(--ink)] focus:border-[color:var(--ink)] focus:outline-none"
        >
          <option value="new">Terbaru</option>
          <option value="price-asc">Harga: rendah → tinggi</option>
          <option value="price-desc">Harga: tinggi → rendah</option>
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-muted)]"
        >
          ▾
        </span>
      </div>
    </form>
  );
}
