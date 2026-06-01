import { Suspense } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import {
  CardSection,
  CardSectionSkeleton,
  EmptyState,
  Stat,
  StatSkeleton,
  tagClass,
} from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { formatIDR, formatShortDate } from "@/lib/money";
import {
  getActiveProductCount,
  getLowStockItems,
  getPaidRevenueTotal,
  getRecentOrders,
} from "@/server/services/dashboard.service";

export const metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader
        title="Ringkasan"
        icon="🏠"
        description="Tampilan awal untuk memantau katalog, pesanan, pembayaran, dan stok."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<StatSkeleton />}>
          <ProductsStat />
        </Suspense>
        <Suspense fallback={<StatSkeleton />}>
          <OrdersStat />
        </Suspense>
        <Suspense fallback={<StatSkeleton />}>
          <RevenueStat />
        </Suspense>
        <Suspense fallback={<StatSkeleton tone="warning" />}>
          <LowStockStat />
        </Suspense>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Suspense fallback={<CardSectionSkeleton title="Pesanan terbaru" rows={5} />}>
          <RecentOrders />
        </Suspense>

        <CardSection title="Aksi cepat" description="Shortcut ke task yang sering dipakai.">
          <div className="grid gap-1">
            {[
              { href: "/admin/products/new", icon: "🌸", label: "Tambah produk baru" },
              { href: "/admin/categories", icon: "🏷️", label: "Kelola kategori" },
              { href: "/admin/addons", icon: "🎁", label: "Kelola add-on" },
              { href: "/admin/invoices", icon: "📄", label: "Lihat invoice" },
              { href: "/admin/delivery", icon: "📅", label: "Atur slot pickup" },
              { href: "/admin/discounts", icon: "💸", label: "Bikin kode diskon" },
              { href: "/admin/settings", icon: "⚙️", label: "Pengaturan toko" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 -mx-2 rounded-md px-2 py-1.5 text-sm text-stone-700 transition hover:bg-stone-100"
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </CardSection>
      </div>

      <Suspense
        fallback={
          <div className="mt-4">
            <CardSectionSkeleton title="Bahan baku perlu di-restock" rows={3} />
          </div>
        }
      >
        <LowStockSection />
      </Suspense>
    </>
  );
}

async function ProductsStat() {
  const count = await getActiveProductCount();
  return <Stat label="Produk aktif" value={count} href="/admin/products" />;
}

async function OrdersStat() {
  const recent = await getRecentOrders();
  const pendingPayment = recent.filter((o) => o.status === "PENDING_PAYMENT").length;
  return (
    <Stat
      label="Pesanan baru"
      value={recent.length}
      hint={pendingPayment ? `${pendingPayment} pending bayar` : undefined}
      href="/admin/orders"
    />
  );
}

async function RevenueStat() {
  const total = await getPaidRevenueTotal();
  return <Stat label="Revenue terbayar" value={formatIDR(total)} href="/admin/payments" />;
}

async function LowStockStat() {
  const lowStock = await getLowStockItems();
  return (
    <Stat
      label="Bahan low stock"
      value={lowStock.length}
      tone={lowStock.length > 0 ? "warning" : "default"}
      hint={
        lowStock.length > 0
          ? lowStock.slice(0, 2).map((i) => i.name).join(", ") +
            (lowStock.length > 2 ? "…" : "")
          : undefined
      }
      href="/admin/inventory"
    />
  );
}

async function RecentOrders() {
  const orders = await getRecentOrders();
  return (
    <CardSection
      title="Pesanan terbaru"
      action={
        <Link href="/admin/orders" className="text-xs font-medium text-stone-500 hover:text-stone-900">
          Lihat semua →
        </Link>
      }
    >
      {orders.length === 0 ? (
        <EmptyState icon="🧾" title="Belum ada pesanan" description="Pesanan baru akan muncul di sini." />
      ) : (
        <ul className="divide-y divide-stone-100">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-3 -mx-2 rounded-md px-2 py-2 transition hover:bg-stone-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-stone-900">{order.orderNumber}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-stone-500">
                    {order.recipientName} · pickup {formatShortDate(order.deliveryDate.toISOString())}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-stone-900">{formatIDR(order.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CardSection>
  );
}

async function LowStockSection() {
  const lowStock = await getLowStockItems();
  if (lowStock.length === 0) return null;
  return (
    <CardSection
      title="Bahan baku perlu di-restock"
      description={`${lowStock.length} item di bawah reorder level.`}
      className="mt-4"
      action={
        <Link href="/admin/inventory" className="text-xs font-medium text-stone-500 hover:text-stone-900">
          Buka inventori →
        </Link>
      }
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lowStock.slice(0, 9).map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-md border border-stone-200 bg-stone-50/40 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-900">{item.name}</p>
              <p className="text-xs text-stone-500">
                Sisa {item.currentQty} {item.unit} · reorder ≤ {item.reorderLevel}
              </p>
            </div>
            <span className={tagClass("amber")}>Low</span>
          </li>
        ))}
      </ul>
    </CardSection>
  );
}
