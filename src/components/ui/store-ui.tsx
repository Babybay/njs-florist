import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

const SIZE: Record<Size, string> = {
  md: "",
  sm: "!px-4 !py-2.5 !text-[11px]",
};

const VARIANT: Record<Variant, string> = {
  primary: "nf-btn nf-btn--primary",
  secondary: "nf-btn nf-btn--secondary",
  ghost: "nf-btn nf-btn--ghost",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className = "",
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return `${VARIANT[variant]} ${SIZE[size]} ${className}`.trim();
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button {...rest} className={buttonClass({ variant, size, className })}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass({ variant, size, className })}>
      {children}
    </Link>
  );
}

export function inputClass(extra = "") {
  return `h-11 w-full rounded-[4px] border border-stone-200 bg-stone-50/80 px-3.5 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)] focus:border-[color:var(--ink)] focus:bg-white focus:outline-none transition-colors ${extra}`.trim();
}

export function labelClass() {
  return "grid gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-black/70";
}

export function PageKicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/55">
      {children}
    </p>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="mt-2 text-3xl font-bold tracking-tight text-black sm:text-4xl">
      {children}
    </h1>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-md border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-md border border-dashed border-stone-300 bg-stone-50 px-6 py-14 text-center">
      {icon ? <div className="text-3xl" aria-hidden>{icon}</div> : null}
      <p className="text-base font-semibold text-black">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-black/60">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-[12px] uppercase tracking-[0.18em] text-black/55"
    >
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {it.href && !isLast ? (
              <Link href={it.href} className="hover:text-black">
                {it.label}
              </Link>
            ) : (
              <span className={isLast ? "text-black" : ""}>{it.label}</span>
            )}
            {!isLast ? <span className="text-black/30">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
