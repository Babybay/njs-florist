"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { signOutAction } from "@/server/actions/auth.actions";

type NavItem = { href: string; label: string };

type User = { name: string | null; email: string; role: string } | null;

const NAV: NavItem[] = [
  { href: "/shop", label: "Katalog" },
  { href: "/custom", label: "Custom" },
  { href: "/blog", label: "Jurnal" },
  { href: "/track", label: "Lacak pesanan" },
];

function CartIcon({ count }: { count: number }) {
  return (
    <span className="relative inline-flex items-center gap-1.5">
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 4h2l1.6 11.2a2 2 0 0 0 2 1.8h8.8a2 2 0 0 0 2-1.6L21 8H6" />
        <circle cx="10" cy="20" r="1.2" />
        <circle cx="17" cy="20" r="1.2" />
      </svg>
      Keranjang
      {count > 0 ? (
        <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[color:var(--rose-deep)] px-1 text-[10px] font-bold leading-none text-[color:var(--cream)]">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </span>
  );
}

function AccountMenu({ user, isAdmin, isStaff }: { user: NonNullable<User>; isAdmin: boolean; isStaff: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[color:var(--ink)]/80 transition hover:bg-[color:var(--blush)] hover:text-[color:var(--ink)]"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--rose-deep)] text-[10px] font-bold text-[color:var(--cream)]">
          {(user.name?.[0] ?? user.email[0] ?? "?").toUpperCase()}
        </span>
        <span className="hidden max-w-[10ch] truncate sm:inline">{user.name ?? user.email.split("@")[0]}</span>
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-[color:var(--rule-strong)] bg-[color:var(--cream)] shadow-[0_24px_60px_-24px_rgba(42,31,34,0.35)]">
          <div className="border-b border-[color:var(--rule)] px-4 py-3 text-xs text-[color:var(--ink)]/65">
            Masuk sebagai
            <p className="mt-0.5 truncate font-semibold text-[color:var(--ink)]">{user.email}</p>
          </div>
          <div className="grid gap-0.5 p-1">
            <MenuLink href="/account" onClick={() => setOpen(false)}>Akun</MenuLink>
            <MenuLink href="/account/orders" onClick={() => setOpen(false)}>Riwayat pesanan</MenuLink>
            {isAdmin ? <MenuLink href="/admin" onClick={() => setOpen(false)}>Admin</MenuLink> : null}
            {isStaff && !isAdmin ? (
              <MenuLink
                href={user.role === "DELIVERY_STAFF" ? "/staff/delivery" : "/staff/florist"}
                onClick={() => setOpen(false)}
              >
                Staff
              </MenuLink>
            ) : null}
          </div>
          <form action={signOutAction} className="border-t border-[color:var(--rule)] p-1">
            <button
              type="submit"
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[color:var(--ink)]/80 transition hover:bg-[color:var(--blush)] hover:text-[color:var(--rose-deep)]"
            >
              Keluar
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-xl px-3 py-2 text-sm text-[color:var(--ink)]/80 transition hover:bg-[color:var(--blush)] hover:text-[color:var(--ink)]"
    >
      {children}
    </Link>
  );
}

export function HeaderClient({
  user,
  isAdmin,
  isStaff,
  cartCount,
}: {
  user: User;
  isAdmin: boolean;
  isStaff: boolean;
  cartCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  // Hide on scroll-down past 120px, reveal on scroll-up. Like Shopify storefronts.
  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 8);
    if (mobileOpen) {
      setHidden(false);
      return;
    }
    if (latest > 120 && latest > prev) setHidden(true);
    else if (latest < prev - 4) setHidden(false);
  });

  return (
    <motion.header
      initial={false}
      animate={reduced ? undefined : { y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      className={`sticky top-0 z-30 border-b transition-colors duration-300 ${
        scrolled
          ? "border-[color:var(--rule)] bg-[color:var(--background)]/85 backdrop-blur-md"
          : "border-transparent bg-[color:var(--background)]/0"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full text-[color:var(--ink)] hover:bg-[color:var(--blush)] lg:hidden"
            aria-label="Buka menu"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="njs florist"
              width={36}
              height={36}
              priority
              className="h-9 w-9 rounded-full object-cover"
            />
            <span className="flex items-baseline gap-2">
              <span className="nf-display text-2xl text-[color:var(--ink)]">njs</span>
              <span className="nf-display italic text-2xl text-[color:var(--rose-deep)]">florist</span>
              <span className="hidden text-[10px] uppercase tracking-[0.28em] text-[color:var(--ink-muted)] sm:inline">
                Bali
              </span>
            </span>
          </Link>
        </div>

        <form action="/shop" className="hidden flex-1 max-w-md lg:flex">
          <input
            type="search"
            name="q"
            placeholder="Cari bunga, buket, hadiah…"
            aria-label="Cari produk"
            className="h-10 w-full rounded-full border border-[color:var(--rule-strong)] bg-[color:var(--cream)] px-5 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)] focus:border-[color:var(--rose-deep)] focus:bg-white focus:outline-none"
          />
        </form>

        <nav className="flex items-center gap-1 text-sm font-medium text-[color:var(--ink)]/80">
          <div className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 transition hover:bg-[color:var(--blush)] hover:text-[color:var(--ink)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link
            href="/cart"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 transition hover:bg-[color:var(--blush)] hover:text-[color:var(--ink)]"
            aria-label={`Keranjang${cartCount > 0 ? `, ${cartCount} item` : ""}`}
          >
            <CartIcon count={cartCount} />
          </Link>
          {user ? (
            <AccountMenu user={user} isAdmin={isAdmin} isStaff={isStaff} />
          ) : (
            <div className="hidden items-center gap-1 lg:flex">
              <Link
                href="/sign-in"
                className="rounded-full px-3 py-2 transition hover:bg-[color:var(--blush)] hover:text-[color:var(--ink)]"
              >
                Masuk
              </Link>
              <Link
                href="/sign-up"
                className="nf-btn nf-btn--primary !px-5 !py-2.5 !text-[10.5px]"
              >
                Daftar
              </Link>
            </div>
          )}
        </nav>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-[color:var(--ink)]/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-[color:var(--background)] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="njs florist"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="nf-display text-2xl text-[color:var(--ink)]">
                  njs <span className="italic text-[color:var(--rose-deep)]">florist</span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup menu"
                className="grid h-9 w-9 place-items-center rounded-full text-[color:var(--ink)] hover:bg-[color:var(--blush)]"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <form action="/shop" className="mt-5">
              <input
                type="search"
                name="q"
                placeholder="Cari…"
                className="h-10 w-full rounded-full border border-[color:var(--rule-strong)] bg-[color:var(--cream)] px-4 text-sm focus:border-[color:var(--rose-deep)] focus:bg-white focus:outline-none"
              />
            </form>
            <nav className="mt-5 grid gap-1 text-base">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-[color:var(--ink)]/85 transition hover:bg-[color:var(--blush)]"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-[color:var(--ink)]/85 transition hover:bg-[color:var(--blush)]"
              >
                Keranjang {cartCount > 0 ? `(${cartCount})` : ""}
              </Link>
            </nav>
            {!user ? (
              <div className="mt-5 grid gap-2 border-t border-[color:var(--rule)] pt-5">
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="nf-btn nf-btn--secondary"
                >
                  Masuk
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="nf-btn nf-btn--primary"
                >
                  Daftar
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </motion.header>
  );
}
