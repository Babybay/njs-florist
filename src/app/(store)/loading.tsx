import { PageShellSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function StoreLoading() {
  return (
    <PageShellSkeleton>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-10 w-2/3 sm:h-12" />
        <Skeleton className="mt-3 h-4 w-1/2" />
        <div className="mt-10 grid gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </PageShellSkeleton>
  );
}
