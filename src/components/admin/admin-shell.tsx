import Image from "next/image";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { BackButton } from "@/components/admin/back-button";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-stone-900">
      <aside className="border-b border-stone-200 bg-stone-50/80 backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="px-4 py-4 lg:shrink-0">
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
        </div>
        <div className="lg:flex-1 lg:overflow-y-auto">
          <AdminNav />
        </div>
      </aside>
      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-2">
            <BackButton />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 border-b border-stone-200 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {icon ? <span className="text-3xl leading-none">{icon}</span> : null}
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{title}</h1>
          </div>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
    </header>
  );
}
