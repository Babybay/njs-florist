import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { BestSellersClient } from "@/components/home/best-sellers-client";
import { HeroClient } from "@/components/home/hero-client";
import { Marquee } from "@/components/home/marquee";
import { PageCurtain } from "@/components/home/page-curtain";
import { listActiveProducts } from "@/server/services/catalog.service";
import { getAllSettings, SETTING_KEYS } from "@/server/services/settings.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, allProducts] = await Promise.all([getAllSettings(), listActiveProducts()]);
  const heroImage = settings[SETTING_KEYS.HOME_HERO_IMAGE] ?? "";
  const bestSellers = allProducts.slice(0, 4);

  return (
    <div className="bg-[color:var(--background)] text-[color:var(--ink)]">
      <PageCurtain />
      <SiteHeader />
      <main className="font-sans">
        <HeroClient image={heroImage} />
        <Marquee />
        <BestSellersClient products={bestSellers} />
      </main>
      <SiteFooter />
    </div>
  );
}
