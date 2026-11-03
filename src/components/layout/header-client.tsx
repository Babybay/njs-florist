"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/server/actions/auth.actions";

type User = { name: string | null; email: string; role: string } | null;
const NAV = [
  { href: "/shop", label: "Koleksi" },
  { href: "/custom", label: "Pesan custom" },
  { href: "/blog", label: "Jurnal" },
  { href: "/track", label: "Lacak pesanan" },
];

function SearchIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
}

function AccountMenu({ user, isAdmin, isStaff }: { user: NonNullable<User>; isAdmin: boolean; isStaff: boolean }) {
  return (
    <details className="store-account">
      <summary aria-label="Menu akun"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></svg><span>{user.name ?? "Akun"}</span></summary>
      <div className="store-account-panel">
        <p>{user.email}</p>
        <Link href="/account">Akun</Link>
        <Link href="/account/orders">Riwayat pesanan</Link>
        {isAdmin ? <Link href="/admin">Admin</Link> : null}
        {isStaff && !isAdmin ? <Link href={user.role === "DELIVERY_STAFF" ? "/staff/delivery" : "/staff/florist"}>Staff</Link> : null}
        <form action={signOutAction}><button type="submit">Keluar</button></form>
      </div>
    </details>
  );
}

export function HeaderClient({ user, isAdmin, isStaff, cartCount }: { user: User; isAdmin: boolean; isStaff: boolean; cartCount: number }) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const panel = dialog.current;
    if (!panel) return;
    if (mobileOpen && !panel.open) panel.showModal();
    if (!mobileOpen && panel.open) panel.close();
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [mobileOpen]);
  useEffect(() => {
    if (!searchOpen) return;
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setSearchOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  return (
    <header className="store-header">
      <div className="store-header-row store-container">
        <button ref={menuButton} type="button" className="store-icon-button store-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Buka menu" aria-expanded={mobileOpen} aria-controls="store-mobile-menu">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg>
        </button>
        <Link href="/" className="store-brand" aria-label="NJS Projects, beranda">
          <Image src="/njs-projects-logo-cutout.webp" alt="" width={48} height={60} className="store-brand-logo" />
        </Link>
        <nav className="store-desktop-nav" aria-label="Navigasi utama">{NAV.map((item) => <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined}>{item.label}</Link>)}</nav>
        <div className="store-header-actions">
          <button className="store-icon-button" type="button" aria-label={searchOpen ? "Tutup pencarian" : "Cari bunga"} aria-expanded={searchOpen} aria-controls="store-header-search" onClick={() => setSearchOpen(!searchOpen)}><SearchIcon /></button>
          <Link href="/cart" className="store-cart" aria-label={`Keranjang, ${cartCount} item`}><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></svg><span>Keranjang</span>{cartCount > 0 ? <b>{cartCount > 99 ? "99+" : cartCount}</b> : null}</Link>
          {user ? <AccountMenu user={user} isAdmin={isAdmin} isStaff={isStaff} /> : <Link href="/sign-in" className="store-sign-in">Masuk</Link>}
        </div>
      </div>
      {searchOpen ? <form id="store-header-search" action="/shop" className="store-header-search store-container"><label htmlFor="store-search">Temukan rangkaian Anda</label><div><input autoFocus id="store-search" type="search" name="q" placeholder="Cari bunga, buket, hadiah…" /><button type="submit" className="nf-btn nf-btn--primary">Cari</button></div></form> : null}
      <dialog ref={dialog} id="store-mobile-menu" className="store-mobile-menu" aria-label="Menu navigasi" onCancel={() => setMobileOpen(false)} onClose={() => { setMobileOpen(false); menuButton.current?.focus(); }} onClick={(event) => { if (event.target === dialog.current) setMobileOpen(false); }}>
        <div className="store-mobile-panel">
          <div className="store-mobile-heading"><span className="store-brand"><Image src="/njs-projects-logo-cutout.webp" alt="NJS Projects" width={48} height={60} className="store-brand-logo" /></span><button type="button" className="store-icon-button" aria-label="Tutup menu" onClick={() => setMobileOpen(false)}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button></div>
          <form action="/shop" className="store-mobile-search"><label htmlFor="store-mobile-search">Cari rangkaian</label><div><input id="store-mobile-search" type="search" name="q" placeholder="Bunga, buket, hadiah…" /><button type="submit" className="store-icon-button" aria-label="Cari"><SearchIcon /></button></div></form>
          <nav aria-label="Navigasi seluler">{NAV.map((item) => <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} onClick={() => setMobileOpen(false)}>{item.label}</Link>)}<Link href="/cart" onClick={() => setMobileOpen(false)}>Keranjang {cartCount > 0 ? `(${cartCount})` : ""}</Link></nav>
          {!user ? <div className="store-mobile-auth"><Link href="/sign-in" className="nf-btn nf-btn--primary" onClick={() => setMobileOpen(false)}>Masuk</Link><Link href="/sign-up" className="store-text-link" onClick={() => setMobileOpen(false)}>Daftar akun</Link></div> : null}
        </div>
      </dialog>
    </header>
  );
}
