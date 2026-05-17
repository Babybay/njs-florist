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

export const metadata = {
  title: "Admin Slot Pickup",
};

export const dynamic = "force-dynamic";

const MONTH_LABEL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function parseMonthKey(raw: string | undefined, today: Date) {
  const fallback = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return fallback;
  const [y, m] = raw.split("-").map(Number);
  if (m < 1 || m > 12) return fallback;
  return raw;
}

export default async function AdminDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const monthKey = parseMonthKey(sp.month, today);
  const [y, m] = monthKey.split("-").map(Number);
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0); // last day of month (day 0 of next month)

  const [slots, monthUtilization, fortnightUtilization, upcomingOverrides, calendarFeed] = await Promise.all([
    listAllDeliverySlots(),
    computeSlotUtilization({ from: monthStart, to: monthEnd }),
    computeSlotUtilization({ days: 14 }),
    listUpcomingOverrides(90),
    getCalendarFeedUrl(),
  ]);

  const utilBySlot = new Map(fortnightUtilization.map((u) => [u.slotId, u.days]));

  const slotsForCalendar = slots.map((s) => ({
    id: s.id,
    label: s.label,
    startTime: s.startTime,
    endTime: s.endTime,
    capacity: s.capacity,
    isActive: s.isActive,
  }));

  const monthLabel = `${MONTH_LABEL[m - 1]} ${y}`;

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
        <SlotCalendar
          slots={slotsForCalendar}
          utilization={monthUtilization}
          monthKey={monthKey}
          todayIso={todayIso}
        />
      </CardSection>

      <CalendarFeedCard url={calendarFeed.url} configured={calendarFeed.configured} />

      <CardSection
        title="Override mendatang"
        description="Daftar tanggal khusus yang sudah diatur (3 bulan ke depan)."
        className="mb-4"
      >
        {upcomingOverrides.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Belum ada override"
            description="Klik tanggal di kalender untuk membuat override pertama."
          />
        ) : (
          <ul className="grid gap-2">
            {upcomingOverrides.map((ov) => {
              const dateLabel = new Date(ov.date).toLocaleDateString("id-ID", {
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
          <SlotCreateForm />
          {slots.map((slot) => (
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
          {slots.length === 0 ? (
            <EmptyState icon="📅" title="Belum ada slot" description="Tambah slot dengan form di atas." />
          ) : null}
        </div>
      </CardSection>
    </>
  );
}
