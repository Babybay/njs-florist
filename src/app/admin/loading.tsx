import { CardSectionSkeleton, Skeleton, StatSkeleton } from "@/components/admin/ui";

export default function AdminLoading() {
  return (
    <>
      <header className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="mt-3 h-3 w-80" />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <CardSectionSkeleton title="Pesanan terbaru" rows={5} />
        <CardSectionSkeleton title="Aksi cepat" rows={6} />
      </div>
    </>
  );
}
