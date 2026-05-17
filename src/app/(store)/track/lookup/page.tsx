import { redirect } from "next/navigation";

export default async function TrackLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const { orderNumber } = await searchParams;
  if (!orderNumber) redirect("/track");
  redirect(`/track/${encodeURIComponent(orderNumber.trim())}`);
}
