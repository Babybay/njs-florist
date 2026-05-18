import { Skeleton } from "@/components/admin/ui";

export default function AdminProductsLoading() {
  return (
    <>
      <header className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="mt-3 h-3 w-80" />
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="overflow-hidden rounded-lg border border-stone-200/80 bg-white">
        <ul className="divide-y divide-stone-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-12 w-12" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-20" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
