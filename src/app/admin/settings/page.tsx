import { AdminPageHeader } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { StoresPanel } from "@/components/admin/stores-panel";
import { getAllSettings } from "@/server/services/settings.service";
import { listStores } from "@/server/services/store.service";

export const metadata = {
  title: "Admin Pengaturan",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, stores] = await Promise.all([getAllSettings(), listStores()]);

  return (
    <>
      <AdminPageHeader
        title="Pengaturan"
        icon="⚙️"
        description="Konfigurasi toko: pickup, biaya layanan, cutoff same-day, dan kontak bisnis. Berubah real-time setelah disimpan."
      />
      <div className="grid gap-4">
        <StoresPanel stores={stores} />
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
