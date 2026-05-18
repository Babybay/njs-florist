import { Skeleton } from "@/components/ui/skeleton";

export default function StaffLoading() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Skeleton className="h-3 w-32" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="mt-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <article key={i} className="rounded-md border border-stone-200 bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-20" rounded="full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-14 w-full" />
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-10 w-32" rounded="full" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
