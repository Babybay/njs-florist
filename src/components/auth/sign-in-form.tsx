"use client";

import { useActionState } from "react";
import {
  type AuthFormState,
  signInWithPasswordAction,
} from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/store-ui";

const initial: AuthFormState = {};

const fieldClass =
  "rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-black";

export function SignInForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInWithPasswordAction, initial);

  return (
    <div className="grid gap-6 rounded-md border border-stone-200 bg-white p-6">
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
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={fieldClass}
          />
        </label>
        {state.error ? (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Memproses…" : "Masuk"}
        </Button>
      </form>
    </div>
  );
}
