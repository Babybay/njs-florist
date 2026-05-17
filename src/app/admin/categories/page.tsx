import { AdminPageHeader } from "@/components/admin/admin-shell";
import { CategoryCreateForm } from "@/components/admin/category-create-form";
import { CategoryRow } from "@/components/admin/category-row";
import { EmptyState } from "@/components/admin/ui";
import { listCategoriesWithCounts } from "@/server/services/category.service";

export const metadata = {
  title: "Admin Kategori",
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesWithCounts();

  return (
    <>
      <AdminPageHeader
        title="Kategori"
        icon="🏷️"
        description="Kelola kategori katalog. Hapus akan ditolak jika masih ada produk yang menempel."
      />

      <CategoryCreateForm />

      <section className="mt-4 grid gap-2.5">
        {categories.length === 0 ? (
          <EmptyState
            icon="🏷️"
            title="Belum ada kategori"
            description="Tambah kategori pertama menggunakan form di atas."
          />
        ) : (
          categories.map((cat) => <CategoryRow key={cat.id} category={cat} />)
        )}
      </section>
    </>
  );
}
