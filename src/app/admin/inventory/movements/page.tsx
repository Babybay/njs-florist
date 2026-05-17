import { db } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/admin-shell";

export const metadata = {
  title: "Mutasi Stok",
};

export const dynamic = "force-dynamic";

export default async function InventoryMovementsPage() {
  const movements = await db.stockMovement.findMany({
    include: { inventoryItem: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <AdminPageHeader
        title="Mutasi stok"
        description="Riwayat IN, OUT, RESERVED, RELEASED, dan ADJUSTMENT dari setiap inventory item."
      />
      {movements.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600">
          Belum ada mutasi stok tercatat. Mutasi akan terisi otomatis ketika pesanan dibayar.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-4 py-4 text-stone-600">{movement.createdAt.toISOString()}</td>
                  <td className="px-4 py-4 font-semibold text-stone-950">{movement.inventoryItem.name}</td>
                  <td className="px-4 py-4 text-stone-600">{movement.type}</td>
                  <td className="px-4 py-4 text-stone-600">{movement.quantity}</td>
                  <td className="px-4 py-4 text-stone-600">{movement.reason ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
