import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { InquiryForm } from "@/components/inquiry-form";
import { PageKicker, PageTitle } from "@/components/ui/store-ui";

export const metadata = {
  title: "Custom bouquet",
  description: "Pesan rangkaian custom dari njs Florist untuk acara spesialmu.",
};

export default function CustomBouquetPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <PageKicker>Custom bouquet</PageKicker>
        <PageTitle>Rangkaian khusus untuk acaramu</PageTitle>
        <p className="mt-4 max-w-2xl leading-7 text-stone-600">
          Tidak menemukan yang pas di katalog? Ceritakan kebutuhanmu — kami akan kembali dengan
          mockup, estimasi harga, dan jadwal pickup dalam 1×24 jam.
        </p>
        <div className="mt-8">
          <InquiryForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
