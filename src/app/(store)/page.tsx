import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { BestSellersClient } from "@/components/home/best-sellers-client";
import { HeroClient } from "@/components/home/hero-client";
import { listActiveProducts } from "@/server/services/catalog.service";
import { getAllSettings, SETTING_KEYS } from "@/server/services/settings.service";

export const revalidate = 300;

export default async function HomePage() {
  const [settings, allProducts] = await Promise.all([getAllSettings(), listActiveProducts()]);
  const heroImage = settings[SETTING_KEYS.HOME_HERO_IMAGE] ?? "";
  const bestSellers = allProducts.slice(0, 4);

  return (
    <div className="bg-[color:var(--background)] text-[color:var(--ink)]">
      <SiteHeader />
      <main id="main-content" className="font-sans">
        <HeroClient image={heroImage} />
        <BestSellersClient products={bestSellers} />
        <section className="store-custom store-container" aria-labelledby="custom-title">
          <h2 id="custom-title">Warna favoritnya.<br />Sentuhan Anda.</h2>
          <div>
            <p>Punya ide buket untuk ulang tahun, pernikahan, atau hadiah personal? Ceritakan pilihan bunga, warna, dan anggaran Anda.</p>
            <Link href="/custom" className="nf-btn nf-btn--primary">Rencanakan buket custom</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
