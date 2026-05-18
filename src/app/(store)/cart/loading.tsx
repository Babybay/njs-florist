import { PageShellSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <PageShellSkeleton>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-10 w-48 sm:h-12" />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <ul className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex gap-4 rounded-md border border-[color:var(--rule)] bg-white p-4">
                <Skeleton className="h-24 w-24 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-5 w-20 self-start" />
              </li>
            ))}
          </ul>

          <aside className="space-y-3 rounded-md border border-[color:var(--rule)] bg-white p-5">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2 border-t border-[color:var(--rule)] pt-3">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex justify-between pt-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" rounded="full" />
          </aside>
        </div>
      </div>
    </PageShellSkeleton>
  );
}
