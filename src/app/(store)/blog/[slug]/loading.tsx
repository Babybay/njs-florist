import { PageShellSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function BlogArticleLoading() {
  return (
    <PageShellSkeleton>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-4 h-12 w-full sm:h-16" />
        <Skeleton className="mt-3 h-12 w-2/3 sm:h-16" />
        <div className="mt-6 flex items-center gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="mt-8 aspect-[16/9] w-full" />
        <div className="mt-10 space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className={`h-3 ${i % 5 === 4 ? "w-3/5" : "w-full"}`} />
          ))}
        </div>
      </article>
    </PageShellSkeleton>
  );
}
