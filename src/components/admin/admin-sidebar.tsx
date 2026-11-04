"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";

function Brand() {
  return <Link href="/" className="flex min-h-11 items-center gap-3 rounded-md px-2 py-1.5 hover:bg-stone-200/50">
    <Image src="/njs-projects-logo-cutout.webp" alt="NJS Projects" width={32} height={40} priority className="h-10 w-8 object-contain" />
    <span className="text-sm font-semibold text-stone-800">Ruang admin</span>
  </Link>;
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (open) dialog.current?.showModal(); else if (dialog.current?.open) dialog.current.close();
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  useEffect(() => {
    const media = matchMedia("(min-width: 1024px)");
    const close = () => { if (media.matches) setOpen(false); };
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);

  function containFocus(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  return <>
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-stone-50 px-3 py-2 lg:hidden">
      <Brand />
      <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-label="Buka menu admin" aria-expanded={open} aria-controls="admin-mobile-menu" className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 hover:bg-stone-100">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
    </div>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-stone-200 bg-stone-50 lg:flex" aria-label="Menu admin">
      <div className="shrink-0 px-4 py-5"><Brand /></div><div className="flex-1 overflow-y-auto"><AdminNav /></div>
    </aside>
    <dialog ref={dialog} id="admin-mobile-menu" aria-label="Menu admin" className="admin-mobile-menu" onKeyDown={containFocus} onCancel={() => setOpen(false)} onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={(event) => { if (event.target === dialog.current) setOpen(false); }}>
      <div className="flex h-full flex-col bg-stone-50">
        <div className="flex shrink-0 items-center justify-between p-4"><Brand /><button type="button" aria-label="Tutup menu admin" onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-stone-200"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto"><AdminNav /></div>
      </div>
    </dialog>
  </>;
}
