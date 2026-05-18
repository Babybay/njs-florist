import { CardSectionSkeleton, Skeleton } from "@/components/admin/ui";

export default function AdminOrderDetailLoading() {
  return (
    <>
      <header className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-44" />
        </div>
        <Skeleton className="mt-3 h-3 w-80" />
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="order-2 grid gap-4 lg:order-none">
          <CardSectionSkeleton title=" "rows={3} />
          <CardSectionSkeleton title=" "rows={4} />
        </div>
        <div className="order-1 grid gap-4 lg:order-none">
          <section className="rounded-lg border border-stone-200/80 bg-white">
            <div className="border-b border-stone-200/80 px-5 py-3">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-3 p-5">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </section>
          <CardSectionSkeleton title=" "rows={2} />
          <CardSectionSkeleton title=" "rows={3} />
        </div>
      </div>
    </>
  );
}
