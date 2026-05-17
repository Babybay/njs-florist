import { AdminPageHeader } from "@/components/admin/admin-shell";
import { HomepageSlot } from "@/components/admin/homepage-slot";
import { getAllSettings, SETTING_KEYS } from "@/server/services/settings.service";

export const metadata = {
  title: "Admin Homepage",
};

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const settings = await getAllSettings();

  return (
    <>
      <AdminPageHeader
        title="Homepage"
        icon="🖼️"
        description="Ganti gambar utama (hero) di landing page. Disimpan ke Cloudinary, otomatis revalidate halaman utama."
      />

      <div className="grid gap-4">
        <HomepageSlot
          title="Hero · gambar utama"
          description="Foto bunga signature di kiri layout hero. Foto vertikal/persegi tinggi (3:4) hasilnya paling rapi karena akan menempati 60% lebar layar."
          aspect="portrait"
          imageKey={SETTING_KEYS.HOME_HERO_IMAGE}
          imageValue={settings[SETTING_KEYS.HOME_HERO_IMAGE] ?? ""}
        />

        <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/60 p-5 text-xs text-stone-600">
          <p className="font-semibold text-stone-800">Catatan</p>
          <p className="mt-1.5 leading-relaxed">
            Saat ini homepage memakai gaya editorial-minimal: satu hero +
            grid best-seller + section &ldquo;Our mission&rdquo;. Slot
            tambahan (Peony banner, Promo banner) sengaja tidak ditampilkan.
            Data lama masih disimpan — jika ingin section tambahan
            dimunculkan lagi, kabari Claude untuk re-enable.
          </p>
        </div>
      </div>
    </>
  );
}
