import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { formatIDR } from "@/lib/money";
import { listProducts } from "@/server/services/product.service";

export const metadata = {
  title: "Admin Produk",
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listProducts();

  return (
    <>
      <AdminPageHeader
        title="Produk"
        description="Kelola katalog: gambar, varian, recipe bahan baku, add-on, dan eligibility same-day."
      />
      <div className="mb-4 flex justify-end">
        <Link
          href="/admin/products/new"
          className="rounded-full bg-rose-900 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
        >
          + Produk baru
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Harga dasar</th>
              <th className="px-4 py-3">Varian</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-4 font-semibold text-stone-950">{product.name}</td>
                <td className="px-4 py-4 text-stone-600">{product.category.name}</td>
                <td className="px-4 py-4 text-stone-600">{formatIDR(product.basePrice)}</td>
                <td className="px-4 py-4 text-stone-600">{product.variants.length}</td>
                <td className="px-4 py-4 text-emerald-700">{product.status}</td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-rose-300"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
