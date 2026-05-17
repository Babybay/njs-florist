import Link from "next/link";
import { StaffQueue } from "@/components/staff/staff-panels";
import { PageKicker, PageTitle } from "@/components/ui/store-ui";

export const metadata = {
  title: "Staff Florist",
};

export const dynamic = "force-dynamic";

export default function FloristStaffPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.18em] text-black underline-offset-4 hover:underline"
        >
          ← njs Florist
        </Link>
        <div className="mt-6">
          <PageKicker>Florist</PageKicker>
          <PageTitle>Antrian florist</PageTitle>
          <p className="mt-3 text-stone-600">
            Pesanan yang sudah dibayar dan sedang disiapkan oleh tim florist.
          </p>
        </div>
        <div className="mt-8">
          <StaffQueue type="florist" />
        </div>
      </div>
    </main>
  );
}
