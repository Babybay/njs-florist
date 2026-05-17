import { AdminPageHeader } from "@/components/admin/admin-shell";
import { AddonCreateForm } from "@/components/admin/addon-create-form";
import { AddonRow } from "@/components/admin/addon-row";
import { EmptyState } from "@/components/admin/ui";
import { listAddonsWithUsage } from "@/server/services/addon.service";
import { listInventoryItems } from "@/server/services/catalog.service";

export const metadata = {
  title: "Admin Add-on",
};

export const dynamic = "force-dynamic";

export default async function AdminAddonsPage() {
  const [addons, inventory] = await Promise.all([
    listAddonsWithUsage(),
    listInventoryItems(),
  ]);

  const inventoryOptions = inventory.map((i) => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
  }));

  return (
    <>
      <AdminPageHeader
        title="Add-on produk"
        icon="🎁"
        description="Item tambahan (mis. coklat, kartu ucapan, vas) yang bisa di-attach ke produk pada halaman detail."
      />

      <AddonCreateForm inventoryItems={inventoryOptions} />

      <section className="mt-4 grid gap-2.5">
        {addons.length === 0 ? (
          <EmptyState icon="🎁" title="Belum ada add-on" description="Tambah add-on pertama menggunakan form di atas." />
        ) : (
          addons.map((a) => (
            <AddonRow key={a.id} addon={a} inventoryItems={inventoryOptions} />
          ))
        )}
      </section>
    </>
  );
}
