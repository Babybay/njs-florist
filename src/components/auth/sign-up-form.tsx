"use client";

import { useActionState } from "react";
import {
  type AuthFormState,
  signInWithGoogleAction,
  signUpWithPasswordAction,
} from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/store-ui";

const initial: AuthFormState = {};

const fieldClass =
  "rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-black";

export function SignUpForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUpWithPasswordAction, initial);

  return (
    <div className="grid gap-6 rounded-md border border-stone-200 bg-white p-6">
      <form action={signInWithGoogleAction}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:border-black hover:bg-[color:var(--blush)]"
        >
          Daftar dengan Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-black/40">
        <span className="h-px flex-1 bg-stone-200" />
        atau email
        <span className="h-px flex-1 bg-stone-200" />
      </div>

      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="next" value={next} />
        <label className="grid gap-2 text-sm font-semibold text-black">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-black">
          Password (min 8 karakter)
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={fieldClass}
          />
        </label>
        {state.error ? (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            {state.error}
          </p>
        ) : null}
        {state.info ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            {state.info}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Memproses…" : "Daftar"}
        </Button>
      </form>
    </div>
  );
}
