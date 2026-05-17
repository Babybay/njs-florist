import Link from "next/link";
import { redirect } from "next/navigation";
import { formatIDR } from "@/lib/money";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  EmptyState,
  LinkButton,
  PageTitle,
} from "@/components/ui/store-ui";
import {
  formatPickupDate,
  statusLabel,
  statusToneClass,
} from "@/lib/order-display";
import { slotLabelsFor } from "@/server/services/slot-display.service";
import { getCurrentUser } from "@/lib/auth";
import { listOrders } from "@/server/services/order.service";

export const metadata = {
  title: "Riwayat Pesanan",
};

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/account/orders");
  const orders = await listOrders({ userId: user.id });
  const slotMap = await slotLabelsFor(orders.map((o) => o.deliverySlotId));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <PageTitle>Riwayat pesanan</PageTitle>
        {orders.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="📦"
              title="Belum ada pesanan"
              description="Setelah checkout pertama, riwayat lengkap muncul di sini."
              action={<LinkButton href="/shop">Lihat katalog</LinkButton>}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-3">
            {orders.map((order) => {
              const first = order.items[0];
              const extra = order.items.length - 1;
              const summary = first
                ? `${first.productName} — ${first.variantName}${extra > 0 ? ` · +${extra} lainnya` : ""}`
                : "Pesanan";
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.orderNumber}`}
                  className="rounded-md border border-stone-200 bg-white p-5 transition hover:border-black"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/55">
                        {order.orderNumber}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-black">{summary}</h2>
                      <p className="mt-1 text-sm text-black/65">
                        {formatPickupDate(order.deliveryDate)} · {slotMap.get(order.deliverySlotId)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-black">{formatIDR(order.total)}</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusToneClass(order.status)}`}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
