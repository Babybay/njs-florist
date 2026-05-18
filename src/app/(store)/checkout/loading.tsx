import { PageShellSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <PageShellSkeleton>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-10 w-44 sm:h-12" />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <section key={i} className="rounded-md border border-[color:var(--rule)] bg-white p-5">
                <Skeleton className="h-4 w-40" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full sm:col-span-2" />
                </div>
              </section>
            ))}
          </div>

          <aside className="space-y-3 rounded-md border border-[color:var(--rule)] bg-white p-5 lg:sticky lg:top-24 lg:self-start">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2.5 border-t border-[color:var(--rule)] pt-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
              <div className="flex justify-between border-t border-[color:var(--rule)] pt-3">
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
