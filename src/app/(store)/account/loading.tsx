import { PageShellSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <PageShellSkeleton>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-10 w-56 sm:h-12" />
        <Skeleton className="mt-3 h-4 w-72" />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border border-[color:var(--rule)] bg-white p-5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-3 h-7 w-32" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-md border border-[color:var(--rule)] bg-white p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20" rounded="full" />
              </div>
              <Skeleton className="mt-2 h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </PageShellSkeleton>
  );
}
