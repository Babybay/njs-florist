"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Img = { url: string; altText: string | null };

export function ProductGallery({ images, productName }: { images: Img[]; productName: string }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const active = images[index] ?? images[0];
  useEffect(() => {
    const panel = dialog.current;
    if (!panel) return;
    if (expanded && !panel.open) panel.showModal();
    if (!expanded && panel.open) panel.close();
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [expanded]);
  function move(direction: number) { setIndex((current) => (current + direction + images.length) % images.length); }
  if (!active) return <div className="store-gallery-missing">Foto {productName} sedang disiapkan.</div>;
  return (
    <div className="store-gallery">
      <button type="button" ref={trigger} className="store-gallery-main" aria-label={`Perbesar foto ${productName}`} aria-haspopup="dialog" onClick={() => setExpanded(true)}>
        <Image src={active.url} alt={active.altText ?? productName} fill priority sizes="(max-width: 1024px) 90vw, 600px" className="object-cover" />
        <span className="store-gallery-zoom" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6M7 10h6M10 7v6" /></svg></span>
      </button>
      {images.length > 1 ? <div className="store-gallery-thumbnails" aria-label="Foto produk">{images.map((image, i) => <button key={`${image.url}-${i}`} type="button" onClick={() => setIndex(i)} aria-pressed={i === index} aria-label={`Lihat foto ${i + 1}`}><Image src={image.url} alt="" fill sizes="80px" className="object-cover" /></button>)}</div> : null}
      <p className="store-gallery-caption">Pilih foto untuk melihat lebih dekat.<span aria-live="polite">{images.length > 1 ? `${index + 1} dari ${images.length}` : ""}</span></p>
      <dialog ref={dialog} className="store-lightbox" aria-label={`Foto ${productName}`} onCancel={() => setExpanded(false)} onClose={() => { setExpanded(false); trigger.current?.focus(); }} onClick={(event) => { if (event.target === dialog.current) setExpanded(false); }} onKeyDown={(event) => { if (event.key === "ArrowRight") { event.preventDefault(); move(1); } if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); } }}>
        <div className="store-lightbox-bar"><p>{productName}</p><button type="button" className="store-icon-button" aria-label="Tutup foto" onClick={() => setExpanded(false)}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button></div>
        <div className="store-lightbox-image"><Image src={active.url} alt={active.altText ?? productName} fill sizes="(max-width: 700px) 95vw, 1000px" className="object-contain" /></div>
        {images.length > 1 ? <div className="store-lightbox-controls"><button type="button" className="nf-btn nf-btn--secondary" onClick={() => move(-1)}>Sebelumnya</button><span aria-live="polite">{index + 1} / {images.length}</span><button type="button" className="nf-btn nf-btn--secondary" onClick={() => move(1)}>Berikutnya</button></div> : null}
      </dialog>
    </div>
  );
}
