"use client";

import { useState, useTransition } from "react";
import { updateSettingsAction } from "@/server/actions/settings.actions";
import { Button, inputClass } from "@/components/admin/ui";

type SettingsFormProps = {
  settings: Record<string, string>;
};

export function SettingsForm({ settings }: SettingsFormProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await updateSettingsAction(formData);
        setMessage("Tersimpan.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      }
    });
  }

  return (
    <form action={submit} className="grid gap-5 rounded-lg border border-stone-200/80 bg-white p-5">
      <Section title="Pickup">
        <Field
          label="Alamat pickup (ditampilkan ke customer)"
          name="pickup_address"
          defaultValue={settings.pickup_address}
          hint="Alamat toko tempat customer mengambil pesanan. Ditampilkan di checkout dan email."
        />
        <Field
          label="Cutoff same-day (jam, 0–23)"
          name="same_day_cutoff_hour"
          type="number"
          min={0}
          max={23}
          defaultValue={settings.same_day_cutoff_hour}
          hint="Pelanggan tidak bisa memilih tanggal pickup hari ini setelah jam ini."
        />
        <Field
          label="Biaya layanan tambahan (IDR)"
          name="delivery_fee"
          type="number"
          min={0}
          defaultValue={settings.delivery_fee}
          hint="Biarkan 0 untuk pickup gratis."
        />
      </Section>

      <Section title="Bisnis">
        <Field
          label="Nama bisnis"
          name="business_name"
          defaultValue={settings.business_name}
        />
        <Field
          label="Telepon bisnis"
          name="business_phone"
          defaultValue={settings.business_phone}
        />
        <Field
          label="Email bisnis"
          name="business_email"
          type="email"
          defaultValue={settings.business_email}
        />
      </Section>

      <div className="flex items-center gap-3 border-t border-stone-200/80 pt-4">
        <Button type="submit" disabled={pending} variant="primary">
          {pending ? "Menyimpan..." : "Simpan pengaturan"}
        </Button>
        {message ? <p className="text-xs font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="text-xs font-medium text-rose-700">{error}</p> : null}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500">{title}</p>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  ...props
}: {
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-stone-800">{label}</span>
      <input {...props} className={inputClass()} />
      {hint ? <span className="text-xs text-stone-500">{hint}</span> : null}
    </label>
  );
}
