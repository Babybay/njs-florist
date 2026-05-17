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

export function generateOrderNumber(date = new Date()) {
  const yyyymmdd = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `BLM-${yyyymmdd}-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;
}
