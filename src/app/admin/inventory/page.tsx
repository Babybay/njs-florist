import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { InventoryCreateForm } from "@/components/admin/inventory-create-form";
import { InventoryRow } from "@/components/admin/inventory-row";
import {
  listInventoryItems,
  listVariantsWithAvailability,
} from "@/server/services/catalog.service";
import { listLowStockItems } from "@/server/services/inventory.service";

export const metadata = {
  title: "Admin Inventori",
};

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const [items, variants, lowStock] = await Promise.all([
    listInventoryItems(),
    listVariantsWithAvailability(),
    listLowStockItems(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Inventori"
        description="Kelola bahan baku, reorder level, dan stock movement. Ketersediaan varian dihitung dari recipe dan stok bahan baku."
      />

      {lowStock.length > 0 ? (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">
            {lowStock.length} bahan menyentuh atau di bawah reorder level
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {lowStock.map((item) => (
              <li key={item.id}>
                <span className="font-semibold">{item.name}</span>{" "}
                <span className="text-amber-800">
                  ({item.currentQty}/{item.reorderLevel} {item.unit})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-stone-950">Bahan baku</h2>
        <Link
          href="/admin/inventory/movements"
          className="text-sm font-semibold text-rose-800 hover:underline"
        >
          Lihat riwayat mutasi
        </Link>
      </div>

      <InventoryCreateForm />

      <section className="mt-6 grid gap-4">
        {items.map((item) => (
          <InventoryRow key={item.id} item={item} />
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-stone-950">Ketersediaan varian</h2>
        <p className="text-sm text-stone-600">
          Dihitung dari minimum(stok bahan / quantityNeeded) di seluruh recipe varian.
        </p>
        <div className="mt-4 grid gap-3">
          {variants.map(({ variant, availability }) => (
            <article
              key={variant.id}
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-stone-950">{variant.product.name}</p>
                  <p className="text-sm text-stone-600">{variant.name}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    availability > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {availability} tersedia
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
