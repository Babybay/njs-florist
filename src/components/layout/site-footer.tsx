import Link from "next/link";
import { getAllSettings, SETTING_KEYS } from "@/server/services/settings.service";

const PAYMENT_METHODS = [
  "GoPay",
  "OVO",
  "DANA",
  "ShopeePay",
  "QRIS",
  "BCA VA",
  "Mandiri VA",
  "BNI VA",
  "BRI VA",
  "Kartu Kredit",
];

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const settings = await getAllSettings();
  const phone = settings[SETTING_KEYS.BUSINESS_PHONE] ?? "+62 812-0000-0000";
  const email = settings[SETTING_KEYS.BUSINESS_EMAIL] ?? "halo@njsflorist.id";
  const waNumber = phone.replace(/[^\d]/g, "");

  return (
    <footer className="bg-[#2a1f22] text-[color:var(--cream)]/85">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="nf-display text-3xl text-[color:var(--cream)]">
            njs <span className="italic text-[color:var(--blush-strong)]">florist</span>
          </p>
          <p className="mt-5 max-w-xs text-sm leading-7 text-[color:var(--cream)]/65">
            Studio bunga di Kuta, Bali — buket harian, flower box, dan
            rangkaian custom. Pesan online, ambil di toko.
          </p>
          <p className="mt-5 text-[11px] uppercase tracking-[0.28em] text-[color:var(--cream)]/45">
            Kuta · Bali · Indonesia
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--blush-strong)]">
            Layanan Pelanggan
          </p>
          <ul className="mt-5 grid gap-2.5 text-sm text-[color:var(--cream)]/70">
            <li><Link href="/track" className="transition hover:text-[color:var(--cream)]">Lacak pesanan</Link></li>
            <li><Link href="/account/orders" className="transition hover:text-[color:var(--cream)]">Riwayat pesanan</Link></li>
            <li><Link href="/custom" className="transition hover:text-[color:var(--cream)]">Custom bouquet</Link></li>
            <li><Link href="/cart" className="transition hover:text-[color:var(--cream)]">Keranjang</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--blush-strong)]">
            Info Toko
          </p>
          <ul className="mt-5 grid gap-2.5 text-sm text-[color:var(--cream)]/70">
            <li><Link href="/shop" className="transition hover:text-[color:var(--cream)]">Katalog</Link></li>
            <li><Link href="/blog" className="transition hover:text-[color:var(--cream)]">Jurnal</Link></li>
            <li><Link href="/custom" className="transition hover:text-[color:var(--cream)]">Pesan custom</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--blush-strong)]">
            Bantuan
          </p>
          <ul className="mt-5 grid gap-2.5 text-sm text-[color:var(--cream)]/70">
            <li>
              <a href={`https://wa.me/${waNumber}`} className="transition hover:text-[color:var(--cream)]" target="_blank" rel="noopener noreferrer">
                WhatsApp {phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${email}`} className="transition hover:text-[color:var(--cream)]">
                {email}
              </a>
            </li>
            <li className="text-[color:var(--cream)]/50">Senin–Minggu · 08.00–20.00 WITA</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[color:var(--cream)]/10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--cream)]/50">
            Metode pembayaran
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <span
                key={m}
                className="rounded-full border border-[color:var(--cream)]/15 bg-[color:var(--cream)]/[0.06] px-3 py-1 text-[11px] font-medium tracking-wide text-[color:var(--cream)]/75"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[color:var(--cream)]/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-[11px] text-[color:var(--cream)]/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {year} njs Florist · Kuta, Bali</p>
          <p>Dirangkai dengan tangan di Bali.</p>
        </div>
      </div>
    </footer>
  );
}
