"use client";

import { motion, useReducedMotion } from "motion/react";

export function PageCurtain() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1], delay: 0.1 }}
      className="pointer-events-none fixed inset-0 z-[60] bg-[color:var(--background)]"
      onAnimationComplete={(definition) => {
        // remove from layout once faded so it never blocks pointer events
        if (typeof definition === "object" && definition && "opacity" in definition) {
          const el = document.querySelector<HTMLElement>("[data-page-curtain]");
          if (el) el.style.display = "none";
        }
      }}
      data-page-curtain
    />
  );
}
