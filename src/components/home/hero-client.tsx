"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { CyclingBloom, LineSprig } from "@/components/brand/flower-graphics";

const EASE = [0.22, 0.61, 0.36, 1] as const;

export function HeroClient({ image }: { image: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-6%"]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden">
      <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 pb-10 pt-8 sm:px-8 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[0.95fr_1.05fr] lg:gap-20 lg:px-12">
        <motion.div style={{ y: imgY }} className="relative order-2 mx-auto w-full max-w-[32rem] lg:order-1">
          <div aria-hidden className="nf-arch absolute inset-0 -rotate-[4deg] scale-[1.03] bg-[color:var(--petal)]/45" />
          <motion.div
            initial={reduced ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
            animate={reduced ? undefined : { clipPath: "inset(0% 0% 0% 0%)" }}
            transition={{ duration: 1.1, ease: EASE }}
            className="nf-arch group relative aspect-[4/5] w-full overflow-hidden bg-[color:var(--blush)] shadow-[0_40px_80px_-40px_rgba(201,96,126,0.55)]"
          >
            {image ? (
              <Image
                src={image}
                alt="Rangkaian bunga dari NJS Projects"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-105"
              />
            ) : null}
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(237,156,176,0.08),transparent_40%,rgba(42,31,34,0.28))]"
            />
          </motion.div>
          <svg
            aria-hidden
            viewBox="0 0 400 500"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full translate-x-4 translate-y-4 overflow-visible text-[color:var(--petal-deep)]"
          >
            <motion.path
              d="M2 498V200A198 198 0 0 1 398 200V498Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: EASE, delay: 0.6 }}
            />
          </svg>
          <LineSprig className="pointer-events-none absolute -left-12 bottom-4 h-56 w-auto text-[color:var(--petal-deep)] sm:-left-16 sm:h-72" />
        </motion.div>

        <div className="order-1 lg:order-2">
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 28 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
            className="nf-bloom mt-6 font-semibold text-[color:var(--ink)]"
          >
            <span className="sr-only">Make your moments exciting with NJS</span>
            <span aria-hidden className="block text-[clamp(2rem,4.2vw,3.75rem)] leading-none">
              Make your
            </span>
            <span aria-hidden className="my-1 block text-[clamp(3.5rem,8vw,7.5rem)] uppercase leading-[0.95] text-[color:var(--petal-deep)]">
              M<CyclingBloom className="mx-[0.03em] inline-block h-[0.74em] w-[0.74em] align-baseline" />MENTS
            </span>
            <span aria-hidden className="block text-[clamp(2rem,4.2vw,3.75rem)] leading-none">
              exciting with <span className="text-[color:var(--petal-deep)]">NJS</span>
            </span>
          </motion.h1>
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.42 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link href="/shop" className="nf-btn nf-btn--primary">
              Lihat koleksi
            </Link>
            <Link href="/custom" className="nf-btn nf-btn--secondary">
              Pesan custom
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
