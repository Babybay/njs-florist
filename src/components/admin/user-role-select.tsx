"use client";

import { useState, useTransition } from "react";
import { updateUserRoleAction } from "@/server/actions/user.actions";

const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "FLORIST_STAFF",
  "DELIVERY_STAFF",
  "CUSTOMER",
] as const;

export function UserRoleSelect({
  userId,
  currentRole,
  disabled = false,
  disabledReason,
}: {
  userId: string;
  currentRole: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(currentRole);

  function onChange(next: string) {
    setError(null);
    setValue(next);
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("role", next);
    startTransition(async () => {
      try {
        await updateUserRoleAction(fd);
      } catch (err) {
        setValue(currentRole);
        setError(err instanceof Error ? err.message : "Gagal ubah role.");
      }
    });
  }

  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || pending}
        title={disabled ? disabledReason : ""}
        className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold outline-none focus:border-rose-500 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      {pending ? <span className="ml-2 text-xs text-stone-500">...</span> : null}
      {error ? <p className="mt-1 text-xs font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
