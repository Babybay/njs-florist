"use client";

import { motion, useReducedMotion } from "motion/react";

const DEFAULT_ITEMS = [
  "Bunga segar harian",
  "Pickup di Kuta",
  "Rangkaian custom",
  "Same-day order sebelum 14.00 WITA",
  "Pengantaran area Bali",
  "Dirangkai dengan tangan",
];

export function Marquee({ items = DEFAULT_ITEMS }: { items?: string[] }) {
  const reduced = useReducedMotion();
  // Double the list so the loop is seamless when offsetting -50%.
  const doubled = [...items, ...items];

  return (
    <section className="relative isolate border-y border-[color:var(--rule)] bg-[color:var(--paper)] py-5">
      <div className="group overflow-hidden">
        <motion.div
          initial={{ x: 0 }}
          animate={reduced ? undefined : { x: "-50%" }}
          transition={
            reduced
              ? undefined
              : { duration: 38, ease: "linear", repeat: Infinity }
          }
          className="flex w-max items-center gap-12 will-change-transform group-hover:[animation-play-state:paused]"
        >
          {doubled.map((item, i) => (
            <span
              key={i}
              className="nf-display italic text-[1.5rem] leading-none text-[color:var(--ink)] sm:text-[1.75rem]"
            >
              <span aria-hidden className="mr-12 text-[color:var(--ink-muted)]">
                ✿
              </span>
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
