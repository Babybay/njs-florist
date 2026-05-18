import Link from "next/link";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-stone-200/80 bg-white ${className}`}>{children}</div>
  );
}

export function CardSection({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-stone-200/80 bg-white ${className}`}>
      {title || action ? (
        <div className="flex items-center justify-between border-b border-stone-200/80 px-5 py-3">
          <div>
            {title ? <h2 className="text-sm font-semibold text-stone-900">{title}</h2> : null}
            {description ? <p className="text-xs text-stone-500">{description}</p> : null}
          </div>
          {action ? <div className="flex items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  href?: string;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50/60 hover:bg-amber-50"
      : tone === "success"
      ? "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50"
      : "border-stone-200/80 bg-white hover:bg-stone-50/70";

  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </>
  );

  const className = `block rounded-lg border p-4 transition ${toneClass}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-stone-200 bg-stone-50/50 px-6 py-12 text-center">
      {icon ? <p className="text-3xl">{icon}</p> : null}
      <p className="text-sm font-medium text-stone-700">{title}</p>
      {description ? <p className="max-w-sm text-xs text-stone-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-stone-900 text-white hover:bg-stone-800",
    secondary: "border border-stone-200 bg-white text-stone-800 hover:bg-stone-100",
    ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
    danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  };
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />;
}

export function inputClass(extra = "") {
  return `w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 transition focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200/70 ${extra}`;
}

export function labelClass(extra = "") {
  return `grid gap-1.5 text-xs font-medium text-stone-700 ${extra}`;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-md bg-stone-200/70 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
    </div>
  );
}

export function StatSkeleton({ tone = "default" }: { tone?: "default" | "warning" }) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50/60"
      : "border-stone-200/80 bg-white";
  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-24" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

export function CardSectionSkeleton({
  title,
  rows = 4,
}: {
  title?: string;
  rows?: number;
}) {
  return (
    <section className="rounded-lg border border-stone-200/80 bg-white">
      {title ? (
        <div className="border-b border-stone-200/80 px-5 py-3">
          <Skeleton className="h-4 w-32" />
        </div>
      ) : null}
      <div className="grid gap-3 p-5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex-1 grid gap-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function tagClass(tone: "neutral" | "rose" | "emerald" | "amber" | "sky" | "violet" = "neutral") {
  const palette = {
    neutral: "bg-stone-100 text-stone-700",
    rose: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return `inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${palette[tone]}`;
}
