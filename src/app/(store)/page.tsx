import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FlowerLineDivider } from "@/components/brand/flower-graphics";
import { BestSellersClient } from "@/components/home/best-sellers-client";
import { HeroClient } from "@/components/home/hero-client";
import { PageCurtain } from "@/components/home/page-curtain";
import { listActiveProducts } from "@/server/services/catalog.service";
import { getAllSettings, SETTING_KEYS } from "@/server/services/settings.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, allProducts] = await Promise.all([getAllSettings(), listActiveProducts()]);
  const heroImage = settings[SETTING_KEYS.HOME_HERO_IMAGE] ?? "";
  const bestSellers = allProducts.slice(0, 4);

  return (
    <div className="relative isolate bg-[color:var(--background)] text-[color:var(--ink)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[110dvh] bg-[linear-gradient(180deg,rgba(237,156,176,0.34)_0%,rgba(237,156,176,0.14)_55%,transparent_100%)]"
      />
      <PageCurtain />
      <SiteHeader />
      <main className="font-sans">
        <HeroClient image={heroImage} />
        <FlowerLineDivider className="mt-2" />
        <BestSellersClient products={bestSellers} />
      </main>
      <SiteFooter />
    </div>
  );
}
