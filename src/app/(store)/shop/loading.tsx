import { PageShellSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <PageShellSkeleton>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[color:var(--rule)] pb-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-56 sm:h-11 sm:w-72" />
          </div>
          <Skeleton className="h-9 w-32" rounded="full" />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" rounded="full" />
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </PageShellSkeleton>
  );
}
