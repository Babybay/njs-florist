import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { InquiryForm } from "@/components/inquiry-form";
import { PageTitle } from "@/components/ui/store-ui";

export const metadata = {
  title: "Pesan Buket & Rangkaian Bunga Custom",
  description: "Sampaikan ide buket Anda kepada NJS Projects di Dalung dan Denpasar. Pilih warna, bunga, anggaran, dan tanggal untuk membahas rangkaian yang sesuai.",
};

export default function CustomBouquetPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <PageTitle>Buket custom, sesuai cerita Anda</PageTitle>
        <p className="mt-4 max-w-2xl leading-7 text-stone-600">
          Sampaikan warna, jenis bunga, anggaran, dan tanggal yang Anda inginkan.
          Tim NJS Projects akan menghubungi Anda untuk membahas pilihan rangkaian dan ketersediaannya.
        </p>
        <div className="mt-8">
          <InquiryForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
