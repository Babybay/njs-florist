import Link from "next/link";
import Image from "next/image";
import { STORE_LOCATIONS } from "@/lib/store-locations";
import { getAllSettings, SETTING_KEYS } from "@/server/services/settings.service";

export async function SiteFooter() {
  const settings = await getAllSettings();
  const phone = settings[SETTING_KEYS.BUSINESS_PHONE] ?? "+62 812-0000-0000";
  const email = settings[SETTING_KEYS.BUSINESS_EMAIL] ?? "halo@njsflorist.id";
  return (
    <footer className="store-footer">
      <div className="store-container store-footer-grid">
        <div className="store-footer-intro">
          <div className="store-footer-brand"><Image src="/njs-projects-logo-cutout.webp" alt="NJS Projects" width={80} height={100} /></div>
          <p>Buket bunga, flower box, dan rangkaian custom dari NJS Projects di Dalung dan Denpasar, Bali. Pilih koleksi atau ceritakan ide hadiah Anda.</p>
        </div>
        <div><h2>Layanan pelanggan</h2><ul>
          <li><Link href="/track">Lacak pesanan</Link></li>
          <li><Link href="/account/orders">Riwayat pesanan</Link></li>
          <li><Link href="/custom">Konsultasi rangkaian</Link></li>
          <li><Link href="/cart">Keranjang</Link></li>
        </ul></div>
        <div><h2>Info & lokasi toko</h2><ul>
          <li><Link href="/shop">Katalog</Link></li>
          <li><Link href="/blog">Tips & inspirasi bunga</Link></li>
          <li><Link href="/custom">Pesan buket custom</Link></li>
          {STORE_LOCATIONS.map((store) => <li key={store.area}><a href={store.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={`${store.name}, buka Google Maps di tab baru`}>{store.name}</a></li>)}
        </ul></div>
        <div><h2>Bantuan</h2><ul>
          <li><a href={`https://wa.me/${phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer">WhatsApp {phone}</a></li>
          <li><a href={`mailto:${email}`}>{email}</a></li>
          <li>Setiap hari, 08.00 sampai 20.00 WITA</li>
        </ul></div>
      </div>
      <div className="store-container store-footer-bottom"><p>© {new Date().getFullYear()} NJS Projects, Bali</p></div>
    </footer>
  );
}
