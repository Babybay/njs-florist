import { requireRole } from "@/lib/auth";
import type { Role } from "@/types/order";

export function requireAdmin() {
  return requireRole(["SUPER_ADMIN", "ADMIN"]);
}

export function requireStaff(role: Extract<Role, "FLORIST_STAFF" | "DELIVERY_STAFF">) {
  // Admins can perform staff actions too.
  return requireRole([role, "SUPER_ADMIN", "ADMIN"]);
}

export function requireSuperAdmin() {
  return requireRole("SUPER_ADMIN");
}
