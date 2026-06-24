import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { BackButton } from "@/components/admin/back-button";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-stone-900">
      <AdminSidebar />
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
