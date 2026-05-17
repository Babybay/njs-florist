import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/55">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-black sm:text-4xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-4 text-stone-600">
        Mungkin link yang kamu buka sudah berubah atau produk yang dicari sudah tidak tersedia.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[color:var(--blush-strong)] hover:text-black"
        >
          Beranda
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center border border-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-black hover:text-white"
        >
          Lihat katalog
        </Link>
      </div>
    </main>
  );
}
