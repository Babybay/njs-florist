"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string };
type NavSection = { title?: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    items: [{ href: "/admin", label: "Ringkasan", icon: "🏠" }],
  },
  {
    title: "Katalog",
    items: [
      { href: "/admin/products", label: "Produk", icon: "🌸" },
      { href: "/admin/categories", label: "Kategori", icon: "🏷️" },
      { href: "/admin/addons", label: "Add-on", icon: "🎁" },
      { href: "/admin/inventory", label: "Inventori", icon: "📦" },
    ],
  },
  {
    title: "Penjualan",
    items: [
      { href: "/admin/orders", label: "Pesanan", icon: "🧾" },
      { href: "/admin/invoices", label: "Invoice", icon: "📄" },
      { href: "/admin/delivery", label: "Slot pickup", icon: "📅" },
      { href: "/admin/payments", label: "Pembayaran", icon: "💳" },
      { href: "/admin/discounts", label: "Diskon", icon: "🏷️" },
    ],
  },
  {
    title: "Engagement",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: "📈" },
      { href: "/admin/inquiries", label: "Inquiry", icon: "✉️" },
    ],
  },
  {
    title: "Tampilan",
    items: [
      { href: "/admin/homepage", label: "Homepage", icon: "🖼️" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/users", label: "Pengguna", icon: "👤" },
      { href: "/admin/settings", label: "Pengaturan", icon: "⚙️" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="grid gap-5 px-2 pb-6">
      {sections.map((section, sIdx) => (
        <div key={sIdx} className="grid gap-0.5">
          {section.title ? (
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              {section.title}
            </p>
          ) : null}
          {section.items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                  active
                    ? "bg-stone-200/70 font-medium text-stone-900"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
