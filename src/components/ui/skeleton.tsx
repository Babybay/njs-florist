export function Skeleton({
  className = "",
  rounded = "md",
}: {
  className?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}) {
  const roundedClass = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[rounded];
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-stone-200/70 ${roundedClass} ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
    </div>
  );
}

export function PageShellSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[color:var(--rule)]/70 bg-[color:var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
          <Skeleton className="h-5 w-28" />
          <div className="hidden items-center gap-6 md:flex">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-14" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" rounded="full" />
            <Skeleton className="h-8 w-8" rounded="full" />
          </div>
        </div>
      </header>
      <main className="bg-[color:var(--background)]">{children}</main>
      <footer className="border-t border-[color:var(--rule)]/70 bg-[color:var(--background)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </footer>
    </>
  );
}
