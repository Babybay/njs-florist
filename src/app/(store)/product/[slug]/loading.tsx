import { PageShellSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <PageShellSkeleton>
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <Skeleton className="h-3 w-64" />

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="space-y-3">
            <Skeleton className="aspect-square w-full" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          </div>

          <section className="space-y-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-12 w-3/4 sm:h-16" />
            <div className="flex items-baseline gap-3 border-b border-[color:var(--rule)] pb-6">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="ml-auto h-3 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-3 w-24" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-11 w-28" />
                <Skeleton className="h-11 w-28" />
                <Skeleton className="h-11 w-28" />
              </div>
              <Skeleton className="mt-4 h-12 w-full" rounded="full" />
            </div>
          </section>
        </div>
      </div>
    </PageShellSkeleton>
  );
}
