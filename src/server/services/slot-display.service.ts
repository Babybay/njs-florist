import { cache } from "react";
import { db } from "@/lib/db";

const loadSlots = cache(async () => {
  const rows = await db.deliverySlot.findMany({
    select: { id: true, label: true, startTime: true, endTime: true },
  });
  const map = new Map<string, { label: string; startTime: string; endTime: string }>();
  for (const r of rows) map.set(r.id, { label: r.label, startTime: r.startTime, endTime: r.endTime });
  return map;
});

function format(s: { label: string; startTime: string; endTime: string }) {
  return `${s.label} · ${s.startTime}–${s.endTime} WITA`;
}

export async function slotLabel(slotId: string): Promise<string> {
  const map = await loadSlots();
  const s = map.get(slotId);
  return s ? format(s) : "Slot tidak ditemukan";
}

export async function slotLabelsFor(slotIds: string[]): Promise<Map<string, string>> {
  const map = await loadSlots();
  const out = new Map<string, string>();
  for (const id of slotIds) {
    const s = map.get(id);
    out.set(id, s ? format(s) : id);
  }
  return out;
}
