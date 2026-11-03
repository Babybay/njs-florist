import { PageShellSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function StoreLoading() {
  return (
    <PageShellSkeleton>
      <div className="store-container">
        <div className="store-hero">
          <div>
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="mt-4 h-16 w-full" />
            <Skeleton className="mt-8 h-4 w-3/4" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-8 h-12 w-40" />
          </div>
          <Skeleton className="store-hero-photo" />
        </div>
      </div>
    </PageShellSkeleton>
  );
}
