"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

const DISPLAY = "nf-display";
const DISPLAY_ITALIC = `${DISPLAY} italic font-normal`;

const EASE = [0.22, 0.61, 0.36, 1] as const;

export function HeroClient({ image }: { image: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Scroll-linked parallax for the image.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-14%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.06]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-8%"]);

  // Pointer-following ambient light blob.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const blobX = useSpring(px, { stiffness: 120, damping: 22, mass: 0.6 });
  const blobY = useSpring(py, { stiffness: 120, damping: 22, mass: 0.6 });

  function onMove(event: React.MouseEvent<HTMLElement>) {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set(event.clientX - rect.left - 200);
    py.set(event.clientY - rect.top - 200);
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="nf-grain relative isolate overflow-hidden bg-[color:var(--background)]"
    >
      {/* Warm radial wash to add depth behind the copy column */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(75%_55%_at_85%_30%,_rgba(231,185,179,0.20),_transparent_65%)]"
      />

      {!reduced ? (
        <motion.div
          aria-hidden
          style={{ x: blobX, y: blobY }}
          className="pointer-events-none absolute left-0 top-0 -z-10 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(231,185,179,0.55)_0%,_rgba(231,185,179,0)_70%)] blur-2xl"
        />
      ) : null}

      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-12 items-stretch gap-0 px-0">
        {/* IMAGE — clipped in a cathedral window arch (brand signature) */}
        <motion.div
          style={{ y: imgY, scale: imgScale }}
          className="relative col-span-12 h-[78vh] origin-left will-change-transform lg:col-span-7 lg:h-auto"
        >
          <div className="nf-arch-soft relative h-full w-full overflow-hidden bg-[color:var(--blush)]">
            {image ? (
              <Image
                src={image}
                alt="Karangan bunga signature dari studio njs florist"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            ) : null}
            {/* Inner vignette for depth at the arch edges */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_30%,_transparent_55%,_rgba(31,29,27,0.18)_100%)]"
            />
          </div>
        </motion.div>

        {/* COPY — right column, three vertical bands (top / middle / bottom) */}
        <motion.div
          style={{ y: copyY }}
          className="relative col-span-12 flex flex-col justify-between gap-10 px-6 pb-14 pt-10 sm:px-10 lg:col-span-5 lg:gap-0 lg:px-12 lg:py-16"
        >
          {/* TOP — editorial eyebrow + "More" */}
          <div>
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="mb-6 flex items-center gap-3"
            >
              <span aria-hidden className="block h-px w-9 bg-[color:var(--ink)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.44em] text-[color:var(--ink-soft)]">
                Spring · Summer · Nº 001
              </span>
            </motion.div>
            <MaskedHeadline
              text="More"
              className={`${DISPLAY} text-[5.5rem] leading-[0.92] text-[color:var(--ink)] sm:text-[7rem] lg:text-[8.5rem] xl:text-[10rem]`}
              ambientDrift
              delay={0.05}
            />
          </div>

          {/* MIDDLE — italic + roman pairing */}
          <div className="mt-auto lg:mt-0">
            <MaskedHeadline
              text="than"
              className={`${DISPLAY_ITALIC} text-[3.5rem] leading-[0.95] text-[color:var(--ink)] sm:text-[4.5rem] lg:text-[5rem]`}
              delay={0.25}
            />
            <MaskedHeadline
              text="flowers"
              className={`${DISPLAY} text-[4.5rem] leading-[0.95] text-[color:var(--ink)] sm:text-[6rem] lg:text-[7.5rem]`}
              delay={0.4}
            />
          </div>

          {/* BOTTOM — body, fleuron divider, CTA group */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.75 }}
            className="space-y-7"
          >
            <p className="max-w-md text-[13px] leading-[1.78] text-[color:var(--ink-soft)]">
              Tim florist berpengalaman kami merangkai bunga sesuai pesanan
              Anda — memakai bunga kualitas terbaik, dirangkai dengan
              perhatian, untuk satu momen yang berarti.
            </p>

            <div aria-hidden className="flex items-center gap-3">
              <span className="block h-px w-9 bg-[color:var(--rule-strong)]" />
              <span className="nf-display text-[16px] italic leading-none text-[color:var(--ink-muted)]">
                ✿
              </span>
              <span className="block h-px flex-1 bg-[color:var(--rule)]" />
            </div>

            <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/shop" className="nf-btn nf-btn--primary">
                Lihat koleksi
              </Link>
              <Link
                href="/custom"
                className="group inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-[color:var(--ink)] transition-colors hover:text-[color:var(--rose-deep)]"
              >
                <span className="relative">
                  Custom order
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-100 bg-current transition-transform duration-500 group-hover:origin-right group-hover:scale-x-0"
                  />
                </span>
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-500 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function MaskedHeadline({
  text,
  className,
  delay = 0,
  ambientDrift = false,
}: {
  text: string;
  className: string;
  delay?: number;
  ambientDrift?: boolean;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <h2 className={className}>{text}</h2>;
  }

  return (
    <span
      aria-label={text}
      className={`relative block overflow-hidden ${className}`}
    >
      <motion.span
        initial={{ y: "110%" }}
        animate={
          ambientDrift
            ? { y: "0%", x: [0, -6, 0, 6, 0] }
            : { y: "0%" }
        }
        transition={
          ambientDrift
            ? {
                y: { duration: 0.95, ease: EASE, delay },
                x: { duration: 16, repeat: Infinity, ease: "easeInOut", delay: delay + 1.2 },
              }
            : { duration: 0.95, ease: EASE, delay }
        }
        className="block will-change-transform"
      >
        {text}
      </motion.span>
    </span>
  );
}
