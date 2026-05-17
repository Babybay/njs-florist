import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { PageKicker, PageTitle } from "@/components/ui/store-ui";

export const metadata = {
  title: "Daftar",
};

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <PageKicker>Akun baru</PageKicker>
        <PageTitle>Daftar akun njs Florist</PageTitle>
        <p className="mt-3 text-sm text-black/65">
          Sudah punya akun?{" "}
          <Link
            href={`/sign-in${next === "/account" ? "" : `?next=${encodeURIComponent(next)}`}`}
            className="font-semibold text-black underline underline-offset-4"
          >
            Masuk di sini
          </Link>
          .
        </p>
        <div className="mt-6">
          <SignUpForm next={next} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
