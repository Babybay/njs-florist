import Link from "next/link";
import { formatPickupDate } from "@/lib/pickup-schedule";

export function PickupTodaySummary({ date, pickups, ready }: { date: string; pickups: number; ready: number }) {
  const queueParams = new URLSearchParams({ pickup: date, status: "PAID,PREPARING,READY_FOR_DELIVERY,OUT_FOR_DELIVERY" });
  const readyParams = new URLSearchParams({ pickup: date, status: "READY_FOR_DELIVERY" });
  return <section className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-stone-200 py-5" aria-label="Operasional pickup hari ini">
    <div><h2 className="text-lg font-semibold text-stone-900">Pickup hari ini</h2><p className="mt-1 text-sm text-stone-600">{formatPickupDate(date)} · WITA · {pickups} pesanan perlu dilayani, {ready} siap diambil.</p></div>
    <div className="flex flex-wrap gap-3"><Link href={`/admin/orders?${queueParams}`} className="inline-flex min-h-11 items-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">Lihat antrean pickup</Link><Link href={`/admin/orders?${readyParams}`} className="inline-flex min-h-11 items-center px-2 py-2 text-sm font-medium text-stone-700 underline underline-offset-4">Siap diambil</Link></div>
  </section>;
}
