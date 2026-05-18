import { PageShellSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function TrackLoading() {
  return (
    <PageShellSkeleton>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-10 w-56 sm:h-12" />
        <Skeleton className="mt-3 h-4 w-2/3" />

        <div className="mt-8 rounded-md border border-[color:var(--rule)] bg-white p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-11 w-full" />
          <Skeleton className="mt-3 h-11 w-32" rounded="full" />
        </div>

        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-3 w-3 mt-1.5" rounded="full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShellSkeleton>
  );
}
