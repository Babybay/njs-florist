import { notFound } from "next/navigation";
import { isUiPreview } from "@/lib/ui-preview";
import { addPickupDays, pickupDateKey } from "@/lib/pickup-schedule";
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell";
import { SlotCalendar } from "@/components/admin/slot-calendar";
import { SlotRow } from "@/components/admin/slot-row";
import { SlotCreateForm } from "@/components/admin/slot-create-form";
import { SettingsForm } from "@/components/admin/settings-form";
import { CardSection } from "@/components/admin/ui";
import { DEFAULT_SETTINGS } from "@/server/services/settings.service";
import Link from "next/link";
import { PickupTodaySummary } from "@/components/admin/pickup-today-summary";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pratinjau admin", robots: { index: false, follow: false } };

export default async function AdminPreviewPage({ searchParams }: { searchParams: Promise<{ month?: string; store?: string }> }) {
  if (!isUiPreview) notFound();
  const params = await searchParams;
  const today = pickupDateKey();
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? "") ? params.month! : today.slice(0, 7);
  const stores = [{ id: "preview-dalung", name: "NJS Project Dalung" }, { id: "preview-denpasar", name: "NJS Project Denpasar" }];
  const selected = stores.find((store) => store.id === params.store) ?? stores[0];
  const slots = [
    { id: `${selected.id}-morning`, label: "Pagi", startTime: "10:00", endTime: "12:00", capacity: 8, isActive: true },
    { id: `${selected.id}-afternoon`, label: "Siang", startTime: "13:00", endTime: "15:00", capacity: 8, isActive: true },
    { id: `${selected.id}-evening`, label: "Sore", startTime: "16:00", endTime: "18:00", capacity: 6, isActive: true },
  ];
  const [year, number] = month.split("-").map(Number);
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const utilization = slots.map((slot, index) => ({ slotId: slot.id, label: slot.label, days: Array.from({ length: count }, (_, offset) => {
    const date = addPickupDays(`${month}-01`, offset);
    const closed = date === addPickupDays(today, 3);
    const overridden = date === addPickupDays(today, 2) || closed;
    const noteOnly = date === addPickupDays(today, 1);
    const capacity = overridden && !closed ? 4 : slot.capacity;
    const booked = date === addPickupDays(today, 2) ? capacity : (offset + index * 2) % (capacity + 1);
    return { date, booked, capacity, isActive: !closed, isOverridden: overridden || noteOnly, note: overridden || noteOnly ? "Contoh pengaturan tanggal khusus" : null,
      overrideCapacity: overridden && !closed ? 4 : null, overrideIsActive: closed ? false : null };
  }) }));
  return <AdminShell>
    <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Pratinjau admin · Seluruh data merupakan contoh. Perubahan tidak disimpan. Area admin asli tetap memerlukan login.</p>
    <AdminPageHeader title="Slot pickup" description="Tinjau kalender, kapasitas harian, dan pengaturan pickup dalam tampilan admin." />
    <div className="mb-6"><PickupTodaySummary date={today} pickups={13} ready={4} /></div>
    <CardSection title="Kalender pickup" description="Data contoh untuk meninjau tata letak admin.">
      <nav aria-label="Toko untuk kalender pickup" className="mb-5 flex flex-wrap gap-2">{stores.map((store) => <Link key={store.id} href={`/preview/admin?month=${month}&store=${store.id}`} aria-current={selected.id === store.id ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-md border px-4 py-2 text-sm ${store.id === selected.id ? "border-rose-800 bg-rose-50 text-rose-900" : "border-stone-200"}`}>{store.name}</Link>)}</nav>
      <SlotCalendar key={`${selected.id}-${month}`} slots={slots} utilization={utilization} monthKey={month} todayIso={today} storeId={selected.id} basePath="/preview/admin" readOnly />
    </CardSection>
    <div className="mt-6 grid gap-6">
      <CardSection title="Slot harian"><SlotCreateForm key={selected.id} stores={stores} defaultStoreId={selected.id} readOnly /><div className="mt-4 grid gap-4">{slots.map((slot) => <SlotRow key={slot.id} slot={slot} readOnly utilization={Array.from({ length: 14 }, (_, index) => {
        const date = addPickupDays(today, index);
        return utilization.find((row) => row.slotId === slot.id)!.days.find((day) => day.date === date) ?? { date, booked: 0, capacity: slot.capacity, isActive: slot.isActive };
      })} />)}</div></CardSection>
      <CardSection title="Pengaturan pickup"><SettingsForm settings={DEFAULT_SETTINGS} readOnly /></CardSection>
    </div>
  </AdminShell>;
}
