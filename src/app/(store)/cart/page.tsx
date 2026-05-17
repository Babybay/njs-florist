import Image from "next/image";
import Link from "next/link";
import { formatIDR } from "@/lib/money";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  EmptyState,
  LinkButton,
  PageTitle,
} from "@/components/ui/store-ui";
import { loadActiveCartAction } from "@/server/actions/cart.actions";
import { removeCartItemAction, updateCartItemQuantityAction } from "@/server/actions/cart.actions";
import { getDeliveryFee } from "@/server/services/pricing.service";

export const metadata = {
  title: "Keranjang",
};

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await loadActiveCartAction();

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <PageTitle>Keranjang</PageTitle>
          <div className="mt-8">
            <EmptyState
              icon="🛍️"
              title="Keranjang kosong"
              description="Pilih bunga dari katalog untuk mulai membuat pesanan."
              action={<LinkButton href="/shop">Lihat katalog</LinkButton>}
            />
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  let subtotal = 0;
  const rows = cart.items.map((item) => {
    const unit = item.variant.product.basePrice + item.variant.priceAdjust;
    const lineProduct = unit * item.quantity;
    const lineAddons = item.addons.reduce(
      (sum, addon) => sum + addon.addon.price * addon.quantity,
      0,
    );
    const lineTotal = lineProduct + lineAddons;
    subtotal += lineTotal;
    return { item, unit, lineProduct, lineAddons, lineTotal };
  });

  const deliveryFee = await getDeliveryFee();
  const total = subtotal + deliveryFee;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <PageTitle>Keranjang</PageTitle>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="grid gap-4">
            {rows.map(({ item, unit, lineTotal }) => {
              const heroImage = item.variant.product.images[0];
              return (
                <article
                  key={item.id}
                  className="rounded-md border border-stone-200 bg-white p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {heroImage ? (
                      <Link
                        href={`/product/${item.variant.product.slug}`}
                        className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md bg-[color:var(--blush)]"
                      >
                        <Image
                          src={heroImage.url}
                          alt={heroImage.altText ?? item.variant.product.name}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      </Link>
                    ) : (
                      <div className="h-28 w-28 shrink-0 rounded-md bg-[color:var(--blush)]" />
                    )}
                    <div className="flex-1">
                      <Link
                        href={`/product/${item.variant.product.slug}`}
                        className="text-lg font-semibold text-black hover:underline underline-offset-4"
                      >
                        {item.variant.product.name}
                      </Link>
                      <p className="mt-1 text-sm text-black/70">{item.variant.name}</p>
                      {item.addons.length > 0 ? (
                        <p className="mt-2 text-xs text-black/60">
                          Add-on: {item.addons.map((a) => a.addon.name).join(", ")}
                        </p>
                      ) : null}
                      {item.cardMessage ? (
                        <p className="mt-2 text-xs italic text-black/60">
                          “{item.cardMessage}”
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <form action={updateCartItemQuantityAction} className="flex items-center gap-2">
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="cartId" value={cart.id} />
                          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/60">
                            Qty
                          </label>
                          <input
                            type="number"
                            name="quantity"
                            min={1}
                            defaultValue={item.quantity}
                            className="w-16 rounded-md border border-stone-300 px-2 py-1 text-sm outline-none focus:border-black"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-black transition hover:border-black"
                          >
                            Update
                          </button>
                        </form>
                        <form action={removeCartItemAction}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="cartId" value={cart.id} />
                          <button
                            type="submit"
                            className="rounded-full px-3 py-1 text-xs font-semibold text-black/70 transition hover:bg-[color:var(--blush)] hover:text-black"
                          >
                            Hapus
                          </button>
                        </form>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-black/55">{formatIDR(unit)} / pcs</p>
                      <p className="mt-1 font-semibold text-black">{formatIDR(lineTotal)}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
          <aside className="rounded-md border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-black/60">
              Ringkasan
            </h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatIDR(subtotal)}</span></div>
              {deliveryFee > 0 ? (
                <div className="flex justify-between text-black/70"><span>Biaya layanan</span><span>{formatIDR(deliveryFee)}</span></div>
              ) : (
                <div className="flex justify-between text-black/70"><span>Pickup di toko</span><span className="font-semibold text-emerald-700">Gratis</span></div>
              )}
              <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold text-black">
                <span>Total</span><span>{formatIDR(total)}</span>
              </div>
            </div>
            <LinkButton href="/checkout" className="mt-6 w-full">
              Lanjut checkout
            </LinkButton>
            <p className="mt-3 text-xs text-black/55">
              Stok dikunci selama 15 menit setelah kamu klik checkout, sampai pembayaran selesai.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
