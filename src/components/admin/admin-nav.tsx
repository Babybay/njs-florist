"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon } from "@/components/admin/admin-icon";

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
  if (pathname === "/preview/admin") return href === "/admin/delivery";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi admin" className="grid gap-5 px-3 pb-6">
      {sections.map((section, sIdx) => (
        <div key={sIdx} className="grid gap-0.5">
          {section.title ? (
            <p className="px-3 pb-1 text-xs font-semibold text-stone-600">
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
                className={`group flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-stone-200/70 font-medium text-stone-900"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                }`}
              >
                <AdminIcon name={item.label} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
