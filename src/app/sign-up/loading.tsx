import { Skeleton } from "@/components/ui/skeleton";

export default function SignUpLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[color:var(--background)] px-4 py-12">
      <div className="w-full max-w-sm rounded-md border border-[color:var(--rule)] bg-white p-6 sm:p-8">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-8 w-44" />
        <Skeleton className="mt-2 h-3 w-56" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
        <Skeleton className="mt-6 h-12 w-full" rounded="full" />
        <div className="mt-4 flex items-center justify-center">
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </main>
  );
}
