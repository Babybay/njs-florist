import { getCurrentUser } from "@/lib/auth";
import { loadActiveCartAction } from "@/server/actions/cart.actions";
import { HeaderClient } from "@/components/layout/header-client";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const cart = await loadActiveCartAction();
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const isStaff = user
    ? ["SUPER_ADMIN", "ADMIN", "FLORIST_STAFF", "DELIVERY_STAFF"].includes(user.role)
    : false;
  const isAdmin = user ? ["SUPER_ADMIN", "ADMIN"].includes(user.role) : false;

  return (
    <HeaderClient
      user={user ? { name: user.name, email: user.email, role: user.role } : null}
      isAdmin={isAdmin}
      isStaff={isStaff}
      cartCount={cartCount}
    />
  );
}
