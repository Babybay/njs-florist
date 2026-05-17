"use client";

import { useRouter, usePathname } from "next/navigation";

function deriveParent(pathname: string): string | null {
  if (pathname === "/admin") return null;
  const parts = pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  parts.pop();
  // pop the id when coming from .../[id]/edit or similar leaf actions
  if (last === "edit" || last === "new" || last === "movements") {
    if (parts[parts.length - 1] && parts[parts.length - 1] !== "admin") {
      // /admin/products/[id]/edit -> /admin/products
      // but keep /admin/inventory/movements -> /admin/inventory
    }
  }
  return "/" + parts.join("/");
}

export function BackButton({ label }: { label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const parent = deriveParent(pathname);
  if (!parent) return null;

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else if (parent) {
      router.push(parent);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
    >
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition group-hover:-translate-x-0.5"
      >
        <path d="M10 12L6 8l4-4" />
      </svg>
      <span>{label ?? "Kembali"}</span>
    </button>
  );
}
