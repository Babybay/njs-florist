/** Bali has a fixed UTC+8 offset, with no daylight saving time. */
export const PICKUP_TIMEZONE = "Asia/Makassar";
export const PICKUP_HOLD_MINUTES = 15;
const DAY_MS = 86_400_000;

export function pickupDateKey(date = new Date()): string {
  return new Date(date.getTime() + 8 * 3_600_000).toISOString().slice(0, 10);
}

export function isPickupDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parsePickupDate(value: string): Date {
  if (!isPickupDateKey(value)) throw new Error("Tanggal pickup tidak valid.");
  return new Date(`${value}T00:00:00+08:00`);
}

/** Date-only database columns use UTC midnight; order timestamps use WITA. */
export function pickupDateColumn(value: string): Date {
  if (!isPickupDateKey(value)) throw new Error("Tanggal pickup tidak valid.");
  return new Date(`${value}T00:00:00Z`);
}

export function addPickupDays(value: string, days: number): string {
  return new Date(pickupDateColumn(value).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function pickupDayBounds(value: string) {
  const start = parsePickupDate(value);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

export function earliestPickupDate(cutoffHour: number, now = new Date()): string {
  const today = pickupDateKey(now);
  return now >= new Date(`${today}T${String(cutoffHour).padStart(2, "0")}:00:00+08:00`)
    ? addPickupDays(today, 1)
    : today;
}

export type PickupSlotStatus = "available" | "full" | "closed" | "past" | "cutoff";
export const PICKUP_STATUS_LABELS: Record<PickupSlotStatus, string> = {
  available: "Tersedia",
  full: "Penuh",
  closed: "Tutup",
  past: "Sudah lewat",
  cutoff: "Batas pemesanan lewat",
};

export type PickupSlotAvailability = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  remaining: number;
  status: PickupSlotStatus;
};
export type PickupDayAvailability = {
  date: string;
  slots: PickupSlotAvailability[];
};
export type PickupAvailability = {
  storeId: string;
  minDate: string;
  today: string;
  cutoffHour: number;
  days: PickupDayAvailability[];
};

export function pickupSlotStatus(input: {
  date: string;
  startTime: string;
  isActive: boolean;
  capacity: number;
  booked: number;
  cutoffHour: number;
  now?: Date;
}): PickupSlotStatus {
  const now = input.now ?? new Date();
  const today = pickupDateKey(now);
  if (input.date < today) return "past";
  if (!input.isActive || input.capacity <= 0) return "closed";
  if (input.date < earliestPickupDate(input.cutoffHour, now)) return "cutoff";
  if (now >= new Date(`${input.date}T${input.startTime}:00+08:00`)) return "past";
  if (input.booked >= input.capacity) return "full";
  return "available";
}

export function formatPickupDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: PICKUP_TIMEZONE, weekday: "long", day: "numeric", month: "long", ...options,
  }).format(parsePickupDate(value));
}
