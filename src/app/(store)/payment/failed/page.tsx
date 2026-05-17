import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LinkButton, PageKicker, PageTitle } from "@/components/ui/store-ui";

export const metadata = {
  title: "Pembayaran Gagal",
};

export default function PaymentFailedPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PageKicker>Pembayaran</PageKicker>
        <PageTitle>Pembayaran tidak terkonfirmasi</PageTitle>
        <p className="mt-4 text-stone-600">
          Pembayaran belum kami terima. Cek metode pembayaranmu lalu coba lagi dari keranjang, atau hubungi
          admin via WhatsApp jika butuh bantuan.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/cart">Kembali ke keranjang</LinkButton>
          <LinkButton href="/shop" variant="secondary">Belanja lain</LinkButton>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
