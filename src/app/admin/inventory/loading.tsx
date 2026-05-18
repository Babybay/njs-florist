import { CardSectionSkeleton, Skeleton, StatSkeleton } from "@/components/admin/ui";

export default function AdminInventoryLoading() {
  return (
    <>
      <header className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-44" />
        </div>
        <Skeleton className="mt-3 h-3 w-80" />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton tone="warning" />
        <StatSkeleton />
        <StatSkeleton />
      </div>

      <div className="mt-6">
        <CardSectionSkeleton title=" " rows={8} />
      </div>
    </>
  );
}
