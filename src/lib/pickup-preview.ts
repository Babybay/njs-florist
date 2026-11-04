/** Illustrative fixtures used only by the development-only UI_PREVIEW gate. */
import { addPickupDays, earliestPickupDate, pickupDateKey, pickupSlotStatus, type PickupAvailability } from "@/lib/pickup-schedule";
import { STORE_LOCATIONS } from "@/lib/store-locations";

export const previewPickupStores = STORE_LOCATIONS.map((store) => ({
  id: `preview-${store.area.toLowerCase()}`, name: store.name,
  address: `${store.area}, Bali`, phone: null, mapsUrl: store.mapsUrl,
}));

export function previewPickupAvailability(storeId: string, from: string, to: string): PickupAvailability {
  const now = new Date();
  const today = pickupDateKey(now);
  const days: PickupAvailability["days"] = [];
  for (let date = from; date <= to; date = addPickupDays(date, 1)) {
    days.push({ date, slots: [
      { id: `${storeId}-morning`, label: "Pagi", startTime: "10:00", endTime: "12:00" },
      { id: `${storeId}-afternoon`, label: "Siang", startTime: "13:00", endTime: "15:00" },
      { id: `${storeId}-evening`, label: "Sore", startTime: "16:00", endTime: "18:00" },
    ].map((slot, index) => {
      const closed = date === addPickupDays(today, 3);
      const booked = date === addPickupDays(today, 2) && index === 0 ? 8 : index === 2 ? 6 : 2;
      return { ...slot, remaining: closed ? 0 : 8 - booked,
        status: pickupSlotStatus({ date, startTime: slot.startTime, isActive: !closed, capacity: 8, booked, cutoffHour: 14, now }),
      };
    }) });
  }
  return { storeId, today, minDate: earliestPickupDate(14, now), cutoffHour: 14, days };
}
