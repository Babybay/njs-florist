"use client";

import { useActionState } from "react";
import {
  subscribeNewsletterAction,
  type NewsletterState,
} from "@/server/actions/newsletter.actions";

const INITIAL: NewsletterState = { ok: false, message: "" };

export function NewsletterForm({ variant = "default" }: { variant?: "default" | "on-rose" }) {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, INITIAL);

  const onRose = variant === "on-rose";

  const inputClass = onRose
    ? "h-12 flex-1 rounded-full border border-[color:var(--cream)]/50 bg-[color:var(--cream)]/12 px-5 text-base text-[color:var(--cream)] placeholder:text-[color:var(--cream)]/60 focus:border-[color:var(--cream)] focus:bg-[color:var(--cream)]/20 focus:outline-none transition-colors backdrop-blur-sm"
    : "h-12 flex-1 rounded-full border border-[color:var(--rule-strong)] bg-white px-5 text-base text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)] focus:border-[color:var(--rose-deep)] focus:outline-none transition-colors";

  const buttonClass = onRose ? "nf-btn nf-btn--on-rose h-12" : "nf-btn nf-btn--primary h-12";

  return (
    <form action={action} className="mx-auto w-full max-w-xl">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder="nama@email.com"
          aria-label="Alamat email"
          className={inputClass}
        />
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Mendaftar…" : "Daftar"}
        </button>
      </div>
      {state.message ? (
        <p
          className={`mt-3 text-sm ${
            state.ok
              ? onRose
                ? "text-[color:var(--cream)]"
                : "text-[color:var(--ink)]"
              : onRose
                ? "text-[color:var(--cream)]"
                : "text-red-700"
          }`}
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
