import { AdminPageHeader } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { getAllSettings } from "@/server/services/settings.service";

export const metadata = {
  title: "Admin Pengaturan",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();

  return (
    <>
      <AdminPageHeader
        title="Pengaturan"
        icon="⚙️"
        description="Konfigurasi toko: pickup, biaya layanan, cutoff same-day, dan kontak bisnis. Berubah real-time setelah disimpan."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
