import { AdminPageHeader } from "@/components/admin/admin-shell";
import { DiscountCreateForm } from "@/components/admin/discount-create-form";
import { DiscountRow } from "@/components/admin/discount-row";
import { EmptyState } from "@/components/admin/ui";
import { listDiscountCodes } from "@/server/services/discount.service";

export const metadata = {
  title: "Admin Diskon",
};

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const discounts = await listDiscountCodes();

  return (
    <>
      <AdminPageHeader
        title="Kode diskon"
        icon="💸"
        description="Kelola kode promo. Berlaku otomatis pada checkout setelah pelanggan memasukkan kode."
      />

      <DiscountCreateForm />

      <section className="mt-4 grid gap-2.5">
        {discounts.length === 0 ? (
          <EmptyState icon="💸" title="Belum ada kode diskon" description="Buat kode pertama menggunakan form di atas." />
        ) : (
          discounts.map((d) => <DiscountRow key={d.id} discount={d} />)
        )}
      </section>
    </>
  );
}
