import { cache } from "react";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/types/order";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

/**
 * Returns the current authenticated user, syncing the Supabase Auth user into
 * our `User` table by email on first login. Returns null when not authenticated.
 *
 * Cached per request so multiple callers (page, layout, action) share one round trip.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  let authUser: { id: string; email?: string | null } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    authUser = data.user;
  } catch {
    // Supabase env not configured yet — treat as anonymous.
    return null;
  }
  if (!authUser?.email) return null;

  const email = authUser.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      role: existing.role,
    };
  }

  const created = await db.user.create({
    data: { email, role: "CUSTOMER" },
  });
  return { id: created.id, email: created.email, name: created.name, role: created.role };
});

export async function getCurrentRole(): Promise<Role | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

export async function requireRole(roles: Role | Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: sign-in required.");
  }
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) {
    throw new Error("FORBIDDEN: insufficient role.");
  }
  return user;
}
