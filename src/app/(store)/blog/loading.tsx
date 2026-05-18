import { PageShellSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <PageShellSkeleton>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-10 w-48 sm:h-12" />
        <Skeleton className="mt-3 h-4 w-2/3" />

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </article>
          ))}
        </div>
      </div>
    </PageShellSkeleton>
  );
}
