import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/admin");
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) redirect("/account");

  return <AdminShell>{children}</AdminShell>;
}
