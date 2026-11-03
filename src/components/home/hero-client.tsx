import Image from "next/image";
import Link from "next/link";
import { STORE_LOCATIONS } from "@/lib/store-locations";

export function HeroClient({ image }: { image: string }) {
  return (
    <section className="store-hero store-container" aria-labelledby="home-title">
      <div className="store-hero-copy">
        <h1 id="home-title">Buket bunga,<br />sepenuh hati.</h1>
        <p>Pilih buket atau pesan rangkaian custom di Dalung dan Denpasar, Bali.</p>
        <div className="store-hero-actions">
          <Link href="/shop" className="nf-btn nf-btn--primary store-hero-primary">Pilih buket<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg></Link>
          <Link href="/custom" className="store-text-link">Buat rangkaian custom</Link>
        </div>
      </div>
      <figure className="store-hero-figure">
        <div className="store-hero-photo">
          <div className="store-hero-image">
            {image ? <Image src={image} alt="Rangkaian bunga segar dari studio NJS Projects" fill priority sizes="(max-width: 700px) 90vw, (max-width: 1280px) 48vw, 600px" className="object-cover" /> : <span className="store-photo-empty">NJS Projects</span>}
          </div>
        </div>
        <figcaption>
          <span>Kunjungi toko kami</span>
          <nav aria-label="Lokasi NJS Projects">{STORE_LOCATIONS.map((store) => <a key={store.area} href={store.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={`NJS Projects ${store.area}, buka Google Maps di tab baru`}>{store.area}<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg></a>)}</nav>
        </figcaption>
      </figure>
    </section>
  );
}
