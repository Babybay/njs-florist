import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED = ["SUPER_ADMIN", "ADMIN", "FLORIST_STAFF", "DELIVERY_STAFF"];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/staff/florist");
  if (!ALLOWED.includes(user.role)) redirect("/account");

  return <>{children}</>;
}
