import { formatIDR } from "@/lib/money";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import {
  EmptyState,
  LinkButton,
  PageKicker,
  PageTitle,
} from "@/components/ui/store-ui";
import { listActiveDeliverySlots } from "@/server/services/catalog.service";
import { loadActiveCartAction } from "@/server/actions/cart.actions";
import { getDeliveryFee } from "@/server/services/pricing.service";
import { getSettingNumber, SETTING_KEYS } from "@/server/services/settings.service";
import { listActiveStores } from "@/server/services/store.service";

export const metadata = {
  title: "Checkout",
};

export const dynamic = "force-dynamic";

function minDeliveryDate(cutoffHour: number) {
  const now = new Date();
  const cutoffPassed = now.getHours() >= cutoffHour;
  const earliest = new Date(now);
  if (cutoffPassed) earliest.setDate(earliest.getDate() + 1);
  return earliest.toISOString().slice(0, 10);
}

export default async function CheckoutPage() {
  const [cart, slots, deliveryFee, cutoffHour, stores] = await Promise.all([
    loadActiveCartAction(),
    listActiveDeliverySlots(),
    getDeliveryFee(),
    getSettingNumber(SETTING_KEYS.SAME_DAY_CUTOFF_HOUR),
    listActiveStores(),
  ]);

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <PageTitle>Checkout</PageTitle>
          <div className="mt-8">
            <EmptyState
              icon="🛍️"
              title="Belum ada yang dicheckout"
              description="Pilih bunga dari katalog dulu, lalu kembali ke checkout."
              action={<LinkButton href="/shop">Lihat katalog</LinkButton>}
            />
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const rows = cart.items.map((item) => {
    const unit = item.variant.product.basePrice + item.variant.priceAdjust;
    const productTotal = unit * item.quantity;
    const addonTotal = item.addons.reduce(
      (sum, addon) => sum + addon.addon.price * addon.quantity,
      0,
    );
    return {
      id: item.id,
      title: `${item.variant.product.name} — ${item.variant.name}`,
      quantity: item.quantity,
      addons: item.addons.map((a) => a.addon.name).join(", "),
      total: productTotal + addonTotal,
    };
  });
  const subtotal = rows.reduce((sum, row) => sum + row.total, 0);
  const total = subtotal + deliveryFee;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <PageKicker>Checkout</PageKicker>
        <PageTitle>Detail pemesan & jadwal pickup</PageTitle>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <CheckoutForm slots={slots} minDate={minDeliveryDate(cutoffHour)} stores={stores} />
          <aside className="grid gap-6">
            <section className="rounded-md border border-stone-200 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-black/60">
                Ringkasan
              </h2>
              <ul className="mt-4 grid gap-3 text-sm">
                {rows.map((row) => (
                  <li key={row.id} className="grid gap-1 rounded-md bg-stone-50 p-3">
                    <span className="font-semibold text-black">{row.title}</span>
                    <span className="text-black/70">
                      {row.quantity} × {formatIDR(row.total / row.quantity)} = {formatIDR(row.total)}
                    </span>
                    {row.addons ? (
                      <span className="text-xs text-black/55">Add-on: {row.addons}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="mt-5 grid gap-2 border-t border-stone-200 pt-4 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatIDR(subtotal)}</span></div>
                {deliveryFee > 0 ? (
                  <div className="flex justify-between text-black/70"><span>Biaya layanan</span><span>{formatIDR(deliveryFee)}</span></div>
                ) : null}
                <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-semibold text-black">
                  <span>Total</span><span>{formatIDR(total)}</span>
                </div>
              </div>
            </section>
            <section className="rounded-md border border-stone-200 bg-[color:var(--blush)] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-black/70">
                Yang perlu kamu tahu
              </h2>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-black/80">
                <li>Pesan sebelum {cutoffHour}.00 WITA untuk pickup hari ini.</li>
                <li>Stok dikunci 15 menit selama pembayaran berjalan.</li>
                <li>Tunjukkan nomor pesanan di toko saat pickup.</li>
                <li>Konfirmasi pembayaran otomatis muncul setelah bayar via Midtrans.</li>
              </ul>
            </section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
