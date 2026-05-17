import { formatIDR } from "@/lib/money";
import {
  formatPickupDate,
  statusLabel,
  statusToneClass,
} from "@/lib/order-display";
import { slotLabelsFor } from "@/server/services/slot-display.service";
import {
  listOrdersForStaffDelivery,
  listOrdersForStaffFlorist,
} from "@/server/services/order.service";
import { OrderActionButton } from "@/components/staff/order-action-button";
import type { OrderStatus } from "@/types/order";

type StaffOrder = Awaited<ReturnType<typeof listOrdersForStaffFlorist>>[number];

function FloristActions({ order }: { order: StaffOrder }) {
  if (order.status === "PAID") {
    return (
      <OrderActionButton
        orderId={order.id}
        toStatus="PREPARING"
        label="Mulai siapkan"
        scope="florist"
      />
    );
  }
  if (order.status === "PREPARING") {
    return (
      <OrderActionButton
        orderId={order.id}
        toStatus="READY_FOR_DELIVERY"
        label="Tandai siap diambil"
        scope="florist"
      />
    );
  }
  return null;
}

function DeliveryActions({ order }: { order: StaffOrder }) {
  if (order.status === "READY_FOR_DELIVERY") {
    return (
      <OrderActionButton
        orderId={order.id}
        toStatus="OUT_FOR_DELIVERY"
        label="Sedang diambil"
        scope="delivery"
      />
    );
  }
  if (order.status === "OUT_FOR_DELIVERY") {
    return (
      <OrderActionButton
        orderId={order.id}
        toStatus="DELIVERED"
        label="Tandai sudah diambil"
        scope="delivery"
        requiresNote
      />
    );
  }
  return null;
}

export async function StaffQueue({ type }: { type: "florist" | "delivery" }) {
  const orders =
    type === "florist"
      ? await listOrdersForStaffFlorist()
      : await listOrdersForStaffDelivery();
  const slotMap = await slotLabelsFor(orders.map((o) => o.deliverySlotId));

  if (orders.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600">
        Antrian masih kosong.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <article
          key={order.id}
          className="rounded-md border border-stone-200 bg-white p-5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60">
                  {order.orderNumber}
                </p>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusToneClass(order.status as OrderStatus)}`}
                >
                  {statusLabel(order.status as OrderStatus)}
                </span>
                <span className="text-sm text-black/65">
                  {formatPickupDate(order.deliveryDate)} · {slotMap.get(order.deliverySlotId)}
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <li key={item.id} className="rounded-md bg-stone-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-black">
                      {item.quantity}× {item.productName} — {item.variantName}
                    </p>
                    {item.addons.length > 0 ? (
                      <ul className="ml-4 mt-1 list-disc text-xs text-black/70">
                        {item.addons.map((addon) => (
                          <li key={addon.id}>
                            + {addon.addonName} × {addon.quantity}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>

              <div className="mt-3 grid gap-1 text-sm text-black/75 sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-black">Penerima:</span>{" "}
                  {order.recipientName} ({order.recipientPhone})
                </p>
                {order.cardMessage ? (
                  <p className="sm:col-span-2">
                    <span className="font-semibold text-black">Pesan kartu:</span>{" "}
                    <span className="italic">&ldquo;{order.cardMessage}&rdquo;</span>
                  </p>
                ) : null}
                {order.deliveryNotes ? (
                  <p className="sm:col-span-2">
                    <span className="font-semibold text-black">Catatan:</span>{" "}
                    {order.deliveryNotes}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <span className="text-lg font-semibold text-black">
                {formatIDR(order.total)}
              </span>
              {type === "florist" ? (
                <FloristActions order={order} />
              ) : (
                <DeliveryActions order={order} />
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
