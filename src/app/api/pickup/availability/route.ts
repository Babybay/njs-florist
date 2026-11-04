import { isPickupDateKey, pickupDateColumn } from "@/lib/pickup-schedule";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getPickupAvailability } from "@/server/services/pickup-availability.service";
import { getStore } from "@/server/services/store.service";
import { isUiPreview } from "@/lib/ui-preview";
import { previewPickupAvailability, previewPickupStores } from "@/lib/pickup-preview";

export async function GET(request: Request) {
  const limit = await rateLimit(clientKey(request, "pickup-availability"), { limit: 60, windowMs: 60_000 });
  if (!limit.ok) return rateLimitResponse(limit);
  const params = new URL(request.url).searchParams;
  const storeId = params.get("storeId") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (!storeId || storeId.length > 100 || !isPickupDateKey(from) || !isPickupDateKey(to) ||
      to < from || pickupDateColumn(to).getTime() - pickupDateColumn(from).getTime() > 41 * 86_400_000) {
    return Response.json({ error: "Pilih toko dan rentang tanggal yang valid (maksimal 42 hari)." }, { status: 400 });
  }
  try {
    if (isUiPreview) {
      if (!previewPickupStores.some((store) => store.id === storeId)) return Response.json({ error: "Toko pickup tidak tersedia." }, { status: 404 });
      return Response.json(previewPickupAvailability(storeId, from, to), { headers: { "Cache-Control": "private, no-store" } });
    }
    const store = await getStore(storeId);
    if (!store?.isActive) return Response.json({ error: "Toko pickup tidak tersedia." }, { status: 404 });
    const availability = await getPickupAvailability(storeId, from, to);
    return Response.json(availability, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Pickup availability failed", error);
    return Response.json({ error: "Jadwal belum bisa dimuat. Coba lagi sebentar." }, { status: 503 });
  }
}
