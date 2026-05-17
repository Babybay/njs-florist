"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/auth";
import type { Role } from "@/types/order";

const ALLOWED_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "FLORIST_STAFF",
  "DELIVERY_STAFF",
  "CUSTOMER",
];

export async function listUsersAction() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });
}

export async function updateUserRoleAction(formData: FormData) {
  const actor = await requireRole("SUPER_ADMIN");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as Role;

  if (!userId) throw new Error("userId is required.");
  if (!ALLOWED_ROLES.includes(role) || role === "GUEST") {
    throw new Error("Role tidak valid.");
  }
  if (userId === actor.id && role !== "SUPER_ADMIN") {
    throw new Error("Tidak bisa menurunkan role sendiri.");
  }

  await db.user.update({
    where: { id: userId },
    data: { role: role as Exclude<Role, "GUEST"> },
  });
  revalidatePath("/admin/users");
}

export async function getActingUserAction() {
  return getCurrentUser();
}
