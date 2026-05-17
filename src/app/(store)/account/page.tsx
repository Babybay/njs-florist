import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageKicker, PageTitle } from "@/components/ui/store-ui";
import { getCurrentUser } from "@/lib/auth";
import { listOrders } from "@/server/services/order.service";

export const metadata = {
  title: "Akun",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/account");
  const orders = await listOrders({ userId: user.id });

  const tiles = [
    {
      href: "/account/orders",
      title: "Riwayat pesanan",
      value: String(orders.length),
      hint: "Pesanan yang terhubung ke akun ini",
    },
    {
      href: "/shop",
      title: "Belanja lagi",
      value: "→",
      hint: "Lihat katalog bunga terbaru",
    },
    {
      href: "/track",
      title: "Lacak pesanan",
      value: "→",
      hint: "Masukkan nomor pesanan tanpa login",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <PageKicker>Akun</PageKicker>
        <PageTitle>
          Halo{user.name ? `, ${user.name}` : `, ${user.email}`}
        </PageTitle>
        <p className="mt-3 max-w-2xl text-stone-600">
          Pesanan, pengaturan, dan hal-hal lain yang terhubung ke akun kamu.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {tiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-md border border-stone-200 bg-white p-5 transition hover:border-black"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/55">
                {t.title}
              </p>
              <p className="mt-2 text-3xl font-bold text-black">{t.value}</p>
              <p className="mt-2 text-sm text-black/60">{t.hint}</p>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
