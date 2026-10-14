import Image from "next/image";
import Link from "next/link";
import { BlossomBranch } from "@/components/brand/flower-graphics";
import { getAllSettings, SETTING_KEYS } from "@/server/services/settings.service";

const LOCATIONS = [
  {
    name: "Dalung",
    href: "https://maps.app.goo.gl/cSi5RLGya56iUCzv7",
  },
  {
    name: "Denpasar",
    href: "https://maps.app.goo.gl/gMPNoNxhK1pBqSFd9",
  },
];

export async function SiteFooter() {
  const settings = await getAllSettings();
  const phone = settings[SETTING_KEYS.BUSINESS_PHONE] ?? "+62 812-0000-0000";
  const email = settings[SETTING_KEYS.BUSINESS_EMAIL] ?? "";
  const waNumber = phone.replace(/[^\d]/g, "");

  return (
    <footer className="overflow-hidden bg-[#2a1f22] text-[color:var(--cream)]/85">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.15fr_0.85fr_0.85fr_1.15fr] lg:px-8">
        <div>
          <Image
            src="/njs-projects-logo.png"
            alt="NJS Projects"
            width={110}
            height={141}
            className="h-28 w-auto object-contain"
          />
          <p className="mt-5 max-w-xs text-sm leading-7 text-[color:var(--cream)]/65">
            Studio bunga untuk hadiah, perayaan, dan momen yang ingin diingat.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--blush-strong)]">
            Layanan pelanggan
          </p>
          <ul className="mt-5 grid gap-2.5 text-sm text-[color:var(--cream)]/70">
            <li><Link href="/track" className="transition hover:text-[color:var(--cream)]">Lacak pesanan</Link></li>
            <li><Link href="/account/orders" className="transition hover:text-[color:var(--cream)]">Riwayat pesanan</Link></li>
            <li><Link href="/custom" className="transition hover:text-[color:var(--cream)]">Pesan custom</Link></li>
            <li><Link href="/cart" className="transition hover:text-[color:var(--cream)]">Keranjang</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--blush-strong)]">
            Lokasi studio
          </p>
          <ul className="mt-5 grid gap-2.5 text-sm text-[color:var(--cream)]/70">
            {LOCATIONS.map((location) => (
              <li key={location.name}>
                <a href={location.href} target="_blank" rel="noopener noreferrer" className="transition hover:text-[color:var(--cream)]">
                  {location.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--blush-strong)]">
            Hubungi kami
          </p>
          <ul className="mt-5 grid gap-2.5 text-sm text-[color:var(--cream)]/70">
            <li>
              <a href={`https://wa.me/${waNumber}`} className="transition hover:text-[color:var(--cream)]" target="_blank" rel="noopener noreferrer">
                WhatsApp {phone}
              </a>
            </li>
            {email ? (
              <li>
                <a href={`mailto:${email}`} className="transition hover:text-[color:var(--cream)]">
                  {email}
                </a>
              </li>
            ) : null}
            <li className="text-[color:var(--cream)]/50">Senin sampai Minggu, 08.00 sampai 20.00 WITA</li>
          </ul>
        </div>
      </div>

      <div className="relative isolate border-t border-[color:var(--cream)]/10">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_50%_100%,_rgba(237,156,176,0.28),_transparent_70%)]"
        />
        <div className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-8">
          <p className="nf-poster select-none whitespace-nowrap text-center text-[clamp(3rem,15.5vw,16rem)] uppercase leading-[0.82] text-[color:var(--cream)]">
            NJS Projects
          </p>
        </div>
        <BlossomBranch className="pointer-events-none absolute left-1/2 top-1/2 w-[64%] max-w-[560px] -translate-x-[30%] -translate-y-1/2 sm:w-[44%]" />
      </div>
    </footer>
  );
}
