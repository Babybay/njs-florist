const DEFAULT_ITEMS = [
  "Bunga segar harian",
  "Pickup di Dalung & Denpasar",
  "Rangkaian custom",
  "Same-day order sebelum 14.00 WITA",
  "Pengantaran area Bali",
  "Dirangkai dengan tangan",
];

export function Marquee({ items = DEFAULT_ITEMS }: { items?: string[] }) {
  return (
    <section aria-label="Layanan NJS Projects" className="border-y border-[color:var(--rule)] bg-[color:var(--paper)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-5 gap-y-3 px-5 py-5 text-sm text-[color:var(--ink-soft)] sm:grid-cols-3 sm:px-8 lg:grid-cols-6">
        {items.map((item) => (
          <p key={item} className="border-l border-[color:var(--rule)] pl-3 first:border-l-0 first:pl-0">{item}</p>
        ))}
      </div>
    </section>
  );
}
