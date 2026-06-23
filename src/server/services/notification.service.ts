import { db } from "@/lib/db";
import { sendEmail } from "@/lib/resend";
import { formatIDR, formatShortDate } from "@/lib/money";
import { sendWhatsApp, sendWhatsAppToAdmin } from "@/lib/whatsapp";
import type { OrderStatus } from "@/types/order";

export async function sendOrderConfirmationEmail(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: true,
      store: true,
    },
  });

  if (!order) return null;
  if (!order.user?.email) return null;

  const itemsHtml = order.items
    .map(
      (item) =>
        `<li>${item.productName} - ${item.variantName} × ${item.quantity} (${formatIDR(item.totalPrice)})</li>`,
    )
    .join("");

  return sendEmail({
    to: order.user.email,
    subject: `Pembayaran diterima - ${order.orderNumber}`,
    html: `
      <p>Halo ${order.user.name ?? order.recipientName},</p>
      <p>Pesanan <strong>${order.orderNumber}</strong> sudah lunas. Berikut ringkasannya:</p>
      <ul>${itemsHtml}</ul>
      <p>Total: <strong>${formatIDR(order.total)}</strong></p>
      <p>Pesanan akan disiapkan oleh tim florist sesuai slot pickup terpilih.</p>
      <p>Datang ke <strong>${order.store.name}</strong> (${order.store.address}) dengan menyebut nomor pesanan ${order.orderNumber}.</p>
    `,
  });
}

const STATUS_COPY: Partial<
  Record<OrderStatus, { subject: (n: string) => string; intro: string }>
> = {
  PREPARING: {
    subject: (n) => `Pesananmu sedang disiapkan - ${n}`,
    intro: "Tim florist kami sudah mulai merangkai pesananmu.",
  },
  READY_FOR_DELIVERY: {
    subject: (n) => `Pesananmu siap diambil - ${n}`,
    intro: "Pesananmu sudah selesai dan siap diambil di toko.",
  },
  DELIVERED: {
    subject: (n) => `Terima kasih, pesananmu sudah diambil - ${n}`,
    intro: "Pesananmu sudah diambil. Terima kasih sudah berbelanja!",
  },
};

export async function sendOrderStatusEmail(orderId: string, status: OrderStatus) {
  const copy = STATUS_COPY[status];
  if (!copy) return null;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });
  if (!order) return null;

  const html = `
    <p>Halo ${order.user?.name ?? order.recipientName},</p>
    <p>${copy.intro}</p>
    <p>Nomor pesanan: <strong>${order.orderNumber}</strong></p>
    <p>Jadwal pickup: ${formatShortDate(order.deliveryDate.toISOString())}</p>
    <p>Atas nama: ${order.recipientName} (${order.recipientPhone})</p>
    <p>Total: <strong>${formatIDR(order.total)}</strong></p>
  `;

  if (order.user?.email) {
    await sendEmail({
      to: order.user.email,
      subject: copy.subject(order.orderNumber),
      html,
    });
  }

  // WhatsApp to recipient phone, fire-and-forget.
  if (order.recipientPhone) {
    sendWhatsApp({
      to: order.recipientPhone,
      body: `${copy.intro}\n\nPesanan: ${order.orderNumber}\nJadwal: ${formatShortDate(
        order.deliveryDate.toISOString(),
      )}\nTotal: ${formatIDR(order.total)}`,
    }).catch((err) => console.error("WA status notify failed:", err));
  }

  return { ok: true };
}

export async function notifyAdminNewPaidOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return null;
  const itemSummary = order.items
    .map((i) => `${i.quantity}× ${i.productName} (${i.variantName})`)
    .join(", ");
  const body =
    `🎉 Pesanan baru sudah dibayar\n` +
    `${order.orderNumber}\n` +
    `${itemSummary}\n` +
    `Total: ${formatIDR(order.total)}\n` +
    `Jadwal: ${formatShortDate(order.deliveryDate.toISOString())}\n` +
    `Penerima: ${order.recipientName} - ${order.deliveryAddress}`;
  return sendWhatsAppToAdmin(body).catch((err) =>
    console.error("WA admin alert failed:", err),
  );
}

async function resolveAdminRecipients(): Promise<string[]> {
  const direct = process.env.LOW_STOCK_ALERT_EMAIL;
  if (direct) {
    return direct
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
  const admins = await db.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    select: { email: true },
  });
  return admins.map((row) => row.email);
}

export async function sendLowStockAlert(item: {
  itemId: string;
  name: string;
  currentQty: number;
  reorderLevel: number;
  unit: string;
}) {
  const recipients = await resolveAdminRecipients();
  if (recipients.length === 0) return null;

  const html = `
    <p>Bahan baku <strong>${item.name}</strong> menyentuh ambang reorder.</p>
    <ul>
      <li>Stok saat ini: ${item.currentQty} ${item.unit}</li>
      <li>Reorder level: ${item.reorderLevel} ${item.unit}</li>
    </ul>
    <p>Segera lakukan pengisian ulang agar varian terkait tidak menjadi tidak tersedia.</p>
  `;

  return Promise.all(
    recipients.map((to) =>
      sendEmail({
        to,
        subject: `Low stock alert: ${item.name}`,
        html,
      }),
    ),
  );
}
