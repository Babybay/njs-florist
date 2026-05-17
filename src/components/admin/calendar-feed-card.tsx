"use client";

import { useState } from "react";
import { Button, CardSection, inputClass } from "@/components/admin/ui";

export function CalendarFeedCard({
  url,
  configured,
}: {
  url: string | null;
  configured: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <CardSection
      title="Sinkron ke Google Calendar"
      description="Tempel URL berikut ke Google Calendar → 'Tambahkan kalender' → 'Dari URL'. Pickup pesanan aktif akan muncul otomatis dan diperbarui berkala."
      className="mb-4"
    >
      {!configured ? (
        <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
          Set <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">CALENDAR_FEED_SECRET</code> di
          {" "}<code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">.env.local</code> (min. 8 karakter acak) lalu restart server untuk mengaktifkan feed iCal.
        </div>
      ) : (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={url ?? ""}
              onFocus={(e) => e.currentTarget.select()}
              className={`${inputClass()} font-mono text-xs`}
            />
            <Button type="button" variant="primary" onClick={copy}>
              {copied ? "Tersalin!" : "Salin URL"}
            </Button>
          </div>
          <p className="text-[11px] text-stone-500">
            Cara subscribe di Google Calendar: buka <span className="font-medium">calendar.google.com</span> → ikon{" "}
            <span className="font-medium">+</span> di sebelah &quot;Kalender lain&quot; → <span className="font-medium">Dari URL</span> → tempel URL di atas.
            URL ini bersifat rahasia (mengandung token akses) — jangan dibagikan publik.
          </p>
        </div>
      )}
    </CardSection>
  );
}
