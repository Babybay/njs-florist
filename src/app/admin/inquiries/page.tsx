import { AdminPageHeader } from "@/components/admin/admin-shell";
import { InquiryRow } from "@/components/admin/inquiry-row";
import { listInquiries } from "@/server/services/inquiry.service";

export const metadata = {
  title: "Admin Inquiry",
};

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const inquiries = await listInquiries();
  const newCount = inquiries.filter((i) => i.status === "NEW").length;

  return (
    <>
      <AdminPageHeader
        title="Custom inquiry"
        description="Permintaan custom bouquet dari halaman /custom. Tindak lanjut via email/WhatsApp."
      />

      {newCount > 0 ? (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {newCount} inquiry baru menunggu follow-up.
        </div>
      ) : null}

      <section className="grid gap-4">
        {inquiries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600">
            Belum ada inquiry masuk.
          </p>
        ) : (
          inquiries.map((i) => <InquiryRow key={i.id} inquiry={i} />)
        )}
      </section>
    </>
  );
}
