"use client";

import Image from "next/image";
import { useState } from "react";

type Img = { url: string; altText: string | null };

export function ProductGallery({
  images,
  productName,
}: {
  images: Img[];
  productName: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const active = images[index];

  if (!active) {
    return (
      <div className="aspect-[4/5] w-full rounded-[4px] bg-[color:var(--blush)]" />
    );
  }

  return (
    <div className="grid gap-3">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[4px] bg-[color:var(--blush)] cursor-zoom-in"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
      >
        <Image
          src={active.url}
          alt={active.altText ?? productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 48vw"
          className={`object-cover transition-transform duration-[1200ms] ease-out ${
            zoom ? "scale-[1.08]" : "scale-100"
          }`}
        />
        {/* badge top-left */}
        <span className="absolute left-4 top-4 bg-[color:var(--paper)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--ink)] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          Studio · njs
        </span>
        {/* counter bottom-right */}
        {images.length > 1 ? (
          <span className="absolute bottom-4 right-4 rounded-full bg-[color:var(--ink)]/85 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-[color:var(--cream)] backdrop-blur-sm">
            {index + 1} / {images.length}
          </span>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Lihat foto ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-[2px] transition duration-300 ${
                i === index
                  ? "ring-2 ring-[color:var(--ink)] opacity-100"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${productName} ${i + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
