"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-stone-200/50"
    >
      <Image
        src="/logo.png"
        alt="njs florist"
        width={28}
        height={28}
        priority
        className="h-7 w-7 rounded-md object-cover"
      />
      <div className="leading-tight">
        <p className="text-sm font-semibold text-stone-900">njs Florist</p>
        <p className="text-[11px] text-stone-500">Workspace admin</p>
      </div>
    </Link>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar with hamburger — only below lg. */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-stone-50/90 px-3 py-2 backdrop-blur lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu admin"
          aria-expanded={open}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-100"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
      </div>

      {/* Mobile drawer overlay. */}
      {open ? (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-stone-900/40 lg:hidden"
        />
      ) : null}

      {/* Drawer (mobile) / fixed sidebar (lg). */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-stone-200 bg-stone-50/95 backdrop-blur transition-transform duration-200 lg:translate-x-0 lg:bg-stone-50/80 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 lg:shrink-0">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu admin"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200/60 hover:text-stone-900 lg:hidden"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AdminNav />
        </div>
      </aside>
    </>
  );
}
