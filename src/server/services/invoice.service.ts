import { db } from "@/lib/db";
import { getAllSettings } from "@/server/services/settings.service";
import type { Order, Payment } from "@prisma/client";

export type InvoiceStatus = "UNPAID" | "PAID" | "REFUNDED" | "VOID";

const VOID_ORDER_STATUSES = new Set(["CANCELLED", "EXPIRED", "PAYMENT_FAILED"]);

function paidTotal(payments: Pick<Payment, "status" | "amount">[]) {
  return payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function invoiceNumber(orderNumber: string) {
  return `INV-${orderNumber}`;
}

export function resolveInvoiceStatus(
  order: Pick<Order, "status" | "total"> & {
    payments: Pick<Payment, "status" | "amount">[];
  },
): InvoiceStatus {
  if (order.status === "REFUNDED" || order.payments.some((payment) => payment.status === "REFUNDED")) {
    return "REFUNDED";
  }

  if (VOID_ORDER_STATUSES.has(order.status)) {
    return "VOID";
  }

  return paidTotal(order.payments) >= order.total ? "PAID" : "UNPAID";
}

export async function listInvoices(filter?: {
  status?: InvoiceStatus;
  q?: string;
  limit?: number;
}) {
  const q = filter?.q?.trim();
  const orderQuery = q?.toUpperCase().startsWith("INV-") ? q.slice(4) : q;

  const orders = await db.order.findMany({
    where: q
      ? {
          OR: [
            { orderNumber: { contains: orderQuery, mode: "insensitive" } },
            { recipientName: { contains: q, mode: "insensitive" } },
            { recipientPhone: { contains: q } },
            { senderName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      payments: {
        select: {
          status: true,
          amount: true,
        },
      },
      items: {
        select: {
          productName: true,
          variantName: true,
          quantity: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: filter?.limit ?? 100,
  });

  return orders
    .map((order) => {
      const paidAmount = paidTotal(order.payments);
      const status = resolveInvoiceStatus(order);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        invoiceNumber: invoiceNumber(order.orderNumber),
        recipientName: order.recipientName,
        senderName: order.senderName,
        createdAt: order.createdAt,
        deliveryDate: order.deliveryDate,
        total: order.total,
        paidAmount,
        balanceDue: Math.max(order.total - paidAmount, 0),
        status,
        items: order.items,
      };
    })
    .filter((invoice) => !filter?.status || invoice.status === filter.status);
}

export async function getInvoice(orderNumber: string) {
  const [settings, order] = await Promise.all([
    getAllSettings(),
    db.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            addons: true,
            variant: {
              include: {
                product: {
                  include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
                },
                recipes: {
                  include: { inventoryItem: { select: { name: true, unit: true } } },
                },
              },
            },
          },
        },
        payments: { orderBy: { createdAt: "desc" } },
        user: { select: { email: true, name: true, phone: true } },
        store: true,
      },
    }),
  ]);

  if (!order) return null;

  const paidAmount = paidTotal(order.payments);

  // Aggregate raw-material (inventory) consumption across the whole order.
  // Per line: recipe.quantityNeeded × item.quantity, summed per inventory item.
  const materialsMap = new Map<string, { name: string; unit: string; quantity: number }>();
  for (const item of order.items) {
    for (const recipe of item.variant.recipes) {
      const used = recipe.quantityNeeded * item.quantity;
      const existing = materialsMap.get(recipe.inventoryItemId);
      if (existing) {
        existing.quantity += used;
      } else {
        materialsMap.set(recipe.inventoryItemId, {
          name: recipe.inventoryItem.name,
          unit: recipe.inventoryItem.unit,
          quantity: used,
        });
      }
    }
  }
  const materials = Array.from(materialsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return {
    order,
    settings,
    invoiceNumber: invoiceNumber(order.orderNumber),
    status: resolveInvoiceStatus(order),
    paidAmount,
    balanceDue: Math.max(order.total - paidAmount, 0),
    materials,
  };
}
