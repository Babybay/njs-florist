import { Skeleton } from "@/components/admin/ui";

export default function AdminOrdersLoading() {
  return (
    <>
      <header className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="mt-3 h-3 w-80" />
      </header>

      <div className="mb-4 rounded-lg border border-stone-200/80 bg-white p-4">
        <div className="grid gap-2 md:grid-cols-[1.6fr_0.9fr_0.9fr_auto]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24" />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-stone-200/80 bg-white">
        <ul className="divide-y divide-stone-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-24" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
