import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ProductCreateForm } from "@/components/admin/product-create-form";
import { listCategories } from "@/server/services/catalog.service";

export const metadata = {
  title: "Produk Baru",
};

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await listCategories();

  return (
    <>
      <AdminPageHeader
        title="Produk baru"
        description="Setelah produk dibuat, lanjutkan tambah varian, recipe bahan baku, dan add-on di halaman edit."
      />
      <ProductCreateForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </>
  );
}
