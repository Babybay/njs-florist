import { AdminPageHeader } from "@/components/admin/admin-shell";
import { SlotCreateForm } from "@/components/admin/slot-create-form";
import { SlotRow } from "@/components/admin/slot-row";
import { SlotCalendar } from "@/components/admin/slot-calendar";
import { CalendarFeedCard } from "@/components/admin/calendar-feed-card";
import { CardSection, EmptyState, tagClass } from "@/components/admin/ui";
import {
  computeSlotUtilization,
  listAllDeliverySlots,
} from "@/server/services/delivery.service";
import { listUpcomingOverrides } from "@/server/services/slot-override.service";
import { getCalendarFeedUrl } from "@/server/services/calendar-feed.service";
import { listStores } from "@/server/services/store.service";
import { pickupDateKey, parsePickupDate } from "@/lib/pickup-schedule";
import Link from "next/link";

export const metadata = {
  title: "Admin Slot Pickup",
};

export const dynamic = "force-dynamic";

const MONTH_LABEL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function parseMonthKey(raw: string | undefined, today: Date) {
  const fallback = pickupDateKey(today).slice(0, 7);
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return fallback;
  const [y, m] = raw.split("-").map(Number);
  if (m < 1 || m > 12 || y < 2000 || y > 9998) return fallback;
  return raw;
}

export default async function AdminDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; store?: string }>;
}) {
  const sp = await searchParams;
  const today = new Date();
  const todayIso = pickupDateKey(today);
  const monthKey = parseMonthKey(sp.month, today);
  const [y, m] = monthKey.split("-").map(Number);
  const monthStart = parsePickupDate(`${monthKey}-01`);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthEnd = parsePickupDate(`${monthKey}-${lastDay}`);

  const [slots, monthUtilization, fortnightUtilization, upcomingOverrides, calendarFeed, stores] = await Promise.all([
    listAllDeliverySlots(),
    computeSlotUtilization({ from: monthStart, to: monthEnd }),
    computeSlotUtilization({ days: 14 }),
    listUpcomingOverrides(90),
    getCalendarFeedUrl(),
    listStores(),
  ]);

  const utilBySlot = new Map(fortnightUtilization.map((u) => [u.slotId, u.days]));

  const slotsForCalendar = slots.map((s) => ({
    id: s.id,
    storeId: s.storeId,
    label: s.label,
    startTime: s.startTime,
    endTime: s.endTime,
    capacity: s.capacity,
    isActive: s.isActive,
  }));

  const monthLabel = `${MONTH_LABEL[m - 1]} ${y}`;
  const selectedStore = stores.find((store) => store.id === sp.store) ?? stores[0];
  const calendarSlots = slotsForCalendar.filter((slot) => slot.storeId === selectedStore?.id);
  const calendarSlotIds = new Set(calendarSlots.map((slot) => slot.id));

  return (
    <>
      <AdminPageHeader
        title="Slot pickup"
        icon="📅"
        description="Kelola slot harian (template berulang) dan override tanggal khusus seperti Valentine, hari libur, dll."
      />

      <CardSection
        title={`Kalender pickup — ${monthLabel}`}
        description="Klik tanggal untuk override kapasitas atau tutup slot. Titik kuning = ada override."
        className="mb-4"
      >
        <nav aria-label="Toko untuk kalender pickup" className="mb-4 flex flex-wrap gap-2">
          {stores.map((store) => <Link key={store.id} href={`/admin/delivery?month=${monthKey}&store=${encodeURIComponent(store.id)}`} scroll={false} aria-current={selectedStore?.id === store.id ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-md border px-4 py-2 text-sm ${selectedStore?.id === store.id ? "border-rose-800 bg-rose-50 text-rose-900" : "border-stone-200 text-stone-700"}`}>{store.name}</Link>)}
        </nav>
        <p className="mb-4 text-sm text-stone-600">Kalender dan override untuk {selectedStore?.name ?? "toko yang dipilih"}. Termasuk slot yang sedang menunggu pembayaran (maksimal 15 menit).</p>
        <SlotCalendar
          key={`${selectedStore?.id}-${monthKey}`}
          slots={calendarSlots}
          utilization={monthUtilization.filter((row) => calendarSlotIds.has(row.slotId))}
          monthKey={monthKey}
          todayIso={todayIso}
          storeId={selectedStore?.id}
        />
      </CardSection>

      <CalendarFeedCard url={calendarFeed.url} configured={calendarFeed.configured} />

      <CardSection
        title="Override mendatang"
        description="Daftar tanggal khusus yang sudah diatur (3 bulan ke depan)."
        className="mb-4"
      >
        {upcomingOverrides.filter((ov) => ov.slot.storeId === selectedStore?.id).length === 0 ? (
          <EmptyState
            icon="📅"
            title="Belum ada override"
            description="Klik tanggal di kalender untuk membuat override pertama."
          />
        ) : (
          <ul className="grid gap-2">
            {upcomingOverrides.filter((ov) => ov.slot.storeId === selectedStore?.id).map((ov) => {
              const dateLabel = new Date(ov.date).toLocaleDateString("id-ID", {
                timeZone: "Asia/Makassar",
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              const status = ov.isActive === false ? "Tutup" : ov.capacity != null ? `Kapasitas ${ov.capacity}` : "Override";
              return (
                <li
                  key={ov.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-stone-200 bg-stone-50/40 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900">{dateLabel}</p>
                    <p className="text-xs text-stone-500">
                      {ov.slot.label} ({ov.slot.startTime}–{ov.slot.endTime})
                      {ov.note ? ` · ${ov.note}` : ""}
                    </p>
                  </div>
                  <span className={tagClass(ov.isActive === false ? "neutral" : "amber")}>{status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardSection>

      <CardSection title="Slot harian (template berulang)" description="Slot yang berlaku setiap hari (kecuali ditimpa override).">
        <div className="grid gap-3">
          <SlotCreateForm key={selectedStore?.id} stores={stores} defaultStoreId={selectedStore?.id} />
          {stores.filter((store) => store.id === selectedStore?.id).map((store) => {
            const storeSlots = slots.filter((s) => s.storeId === store.id);
            if (storeSlots.length === 0) return null;
            return (
              <div key={store.id} className="grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{store.name}</p>
                {storeSlots.map((slot) => (
                  <SlotRow
                    key={slot.id}
                    slot={{
                      id: slot.id,
                      label: slot.label,
                      startTime: slot.startTime,
                      endTime: slot.endTime,
                      capacity: slot.capacity,
                      isActive: slot.isActive,
                    }}
                    utilization={(utilBySlot.get(slot.id) ?? []).slice(0, 14)}
                  />
                ))}
              </div>
            );
          })}
          {slots.length === 0 ? (
            <EmptyState icon="📅" title="Belum ada slot" description="Tambah slot dengan form di atas." />
          ) : null}
        </div>
      </CardSection>
    </>
  );
}
