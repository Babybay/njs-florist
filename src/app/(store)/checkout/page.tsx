import { formatIDR } from "@/lib/money";
import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import {
  EmptyState,
  LinkButton,
  PageTitle,
} from "@/components/ui/store-ui";
import { loadActiveCartAction } from "@/server/actions/cart.actions";
import { getDeliveryFee } from "@/server/services/pricing.service";
import { getSettingNumber, SETTING_KEYS } from "@/server/services/settings.service";
import { listActiveStores } from "@/server/services/store.service";
import { addPickupDays, earliestPickupDate, pickupDateKey } from "@/lib/pickup-schedule";
import { isUiPreview } from "@/lib/ui-preview";
import { previewPickupStores } from "@/lib/pickup-preview";

export const metadata = {
  title: "Checkout",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [cart, deliveryFee, cutoffHour, stores] = await Promise.all([
    isUiPreview ? null : loadActiveCartAction(),
    getDeliveryFee(),
    getSettingNumber(SETTING_KEYS.SAME_DAY_CUTOFF_HOUR),
    isUiPreview ? previewPickupStores : listActiveStores(),
  ]);

  if (!isUiPreview && (!cart || cart.items.length === 0)) {
    return (
      <>
        <SiteHeader />
        <main id="main-content" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
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

  const rows = isUiPreview ? [{ id: "preview", title: "Peony garden — Standard", quantity: 1, addons: "", total: 425000,
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=200&q=80" }] : (cart?.items ?? []).map((item) => {
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
      image: item.variant.product.images[0]?.url ?? null,
    };
  });
  const subtotal = rows.reduce((sum, row) => sum + row.total, 0);
  const total = subtotal + deliveryFee;
  const requiresAdvance = !isUiPreview && cart?.items.some((item) => !item.variant.product.isSameDayEligible);
  const minDate = requiresAdvance && earliestPickupDate(cutoffHour) === pickupDateKey()
    ? addPickupDays(pickupDateKey(), 1) : earliestPickupDate(cutoffHour);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="store-container checkout-page">
        <nav className="checkout-breadcrumb" aria-label="Tahap pemesanan"><Link href="/cart">Keranjang</Link><span aria-hidden="true">/</span><span aria-current="step">Detail & jadwal pickup</span><span aria-hidden="true">/</span><span>Pembayaran</span></nav>
        <PageTitle>Sedikit lagi, jadi milik Anda.</PageTitle>
        <p className="checkout-intro">Atur waktu pickup, tulis pesan kecil, dan biarkan kami menyiapkan buket Anda.</p>
        {isUiPreview ? <p className="checkout-preview-note" role="note">Pratinjau desain · Produk, toko, dan ketersediaan di bawah adalah data contoh. Pemesanan dan pembayaran dinonaktifkan.</p> : null}
        <div className="checkout-layout">
          <div>{requiresAdvance ? <p className="checkout-preview-note">Ada rangkaian yang perlu disiapkan lebih awal. Jadwal pickup tersedia mulai besok.</p> : null}<CheckoutForm minDate={minDate} stores={stores} preview={isUiPreview} /></div>
          <aside className="checkout-aside" aria-label="Ringkasan pesanan">
            <section className="checkout-order-summary">
              <h2>
                Buket pilihan Anda
              </h2>
              <ul className="checkout-summary-items">
                {rows.map((row) => (
                  <li key={row.id}>
                    {row.image ? <Image src={row.image} alt="" width={80} height={100} className="checkout-summary-image" /> : null}
                    <div><span className="checkout-item-title">{row.title}</span>
                    <span className="checkout-help">Jumlah: {row.quantity}</span>
                    {row.addons ? (
                      <span className="checkout-help">Tambahan: {row.addons}</span>
                    ) : null}
                    <strong>{formatIDR(row.total)}</strong></div></li>
                ))}
              </ul>
              <div className="checkout-totals">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatIDR(subtotal)}</span></div>
                {deliveryFee > 0 ? (
                  <div className="flex justify-between text-black/70"><span>Biaya layanan</span><span>{formatIDR(deliveryFee)}</span></div>
                ) : null}
                <div className="checkout-total">
                  <span>Total</span><span>{formatIDR(total)}</span>
                </div>
              </div>
              <Link href="/cart" className="checkout-edit-cart">Ubah isi keranjang</Link>
            </section>
            <section className="checkout-pickup-info">
              <h2>
                Sebelum mengambil buket
              </h2>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-black/80">
                <li>Pickup hari ini sebelum {cutoffHour}.00 WITA, selama jam dan kapasitas masih tersedia.</li>
                <li>Slot ditahan 15 menit setelah pesanan dibuat.</li>
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
