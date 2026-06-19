export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const ORDER_TZ = "Asia/Makassar"; // WITA (UTC+8), Bali — fixed offset, no DST.

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Calendar year/month/day in the store's timezone (WITA). */
export function witaDateParts(date = new Date()) {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: ORDER_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

/** UTC instants [start, end) bounding the given WITA calendar day. */
export function witaDayRange(date = new Date()) {
  const { y, m, d } = witaDateParts(date);
  const start = new Date(`${y}-${pad2(m)}-${pad2(d)}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end, y, m, d };
}

/**
 * Order / pay code: `njs-YYYYMMDD` + a 4-digit daily sequence that resets each
 * WITA day. e.g. the first order on 19 Jun 2026 → `njs-202606190001`.
 */
export function formatOrderNumber(
  year: number,
  month: number,
  day: number,
  sequence: number,
) {
  return `njs-${year}${pad2(month)}${pad2(day)}${String(sequence).padStart(4, "0")}`;
}
