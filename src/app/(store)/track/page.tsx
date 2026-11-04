import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button, PageKicker, PageTitle, inputClass } from "@/components/ui/store-ui";

export const metadata = {
  title: "Lacak pesanan",
};

export default function TrackLandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <PageKicker>Lacak pesanan</PageKicker>
        <PageTitle>Cek status pesananmu</PageTitle>
        <p className="mt-3 text-stone-600">
          Masukkan nomor pesanan dari konfirmasi pembayaran (mis. njs-202611040001) untuk melihat status terkini tanpa perlu login.
        </p>
        <form
          action="/track/lookup"
          method="get"
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <div className="flex-1">
            <label htmlFor="orderNumber" className="sr-only">
              Nomor pesanan
            </label>
            <input
              id="orderNumber"
              name="orderNumber"
              required
              placeholder="njs-202611040001"
              className={inputClass("w-full")}
            />
          </div>
          <Button type="submit">Lacak</Button>
        </form>
        <p className="mt-6 text-sm text-black/60">
          Punya akun?{" "}
          <Link href="/account/orders" className="font-semibold text-black underline underline-offset-4">
            Lihat semua pesananmu di sini
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
