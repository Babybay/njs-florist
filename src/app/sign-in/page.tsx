import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SignInForm } from "@/components/auth/sign-in-form";
import { PageKicker, PageTitle } from "@/components/ui/store-ui";

export const metadata = {
  title: "Masuk",
};

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <PageKicker>Akun</PageKicker>
        <PageTitle>Masuk ke njs Florist</PageTitle>
        <p className="mt-3 text-sm text-black/65">
          Belum punya akun?{" "}
          <Link
            href={`/sign-up${next === "/account" ? "" : `?next=${encodeURIComponent(next)}`}`}
            className="font-semibold text-black underline underline-offset-4"
          >
            Daftar di sini
          </Link>
          .
        </p>
        {error ? (
          <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}
        <div className="mt-6">
          <SignInForm next={next} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
