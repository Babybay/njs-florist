"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";

const EASE = [0.22, 0.61, 0.36, 1] as const;
const PETAL_ANGLES = [0, 72, 144, 216, 288];

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (delay: number = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.4, ease: EASE, delay },
      opacity: { duration: 0.2, delay },
    },
  }),
};

const bloom: Variants = {
  hidden: { scale: 0, rotate: -45, opacity: 0 },
  show: (delay: number = 0) => ({
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 160, damping: 14, delay },
  }),
};

/* Filled five-petal flower used as a letterform replacement and badge center. */
export function BloomMark({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.svg
      aria-hidden
      viewBox="-50 -50 100 100"
      className={className}
      initial={reduced ? false : { scale: 0, rotate: -90 }}
      animate={reduced ? undefined : { scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 12, delay: 0.35 }}
    >
      <g className="nf-spin-slow" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        {PETAL_ANGLES.map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy="-24"
            rx="15"
            ry="22"
            transform={`rotate(${angle})`}
            fill="var(--petal)"
            stroke="var(--petal-deep)"
            strokeWidth="5"
          />
        ))}
        <circle r="11" fill="var(--petal-deep)" />
        <circle r="4" fill="var(--cream)" />
      </g>
    </motion.svg>
  );
}

const GLYPH_STROKE = { fill: "var(--petal)", stroke: "var(--petal-deep)", strokeWidth: 4.5, strokeLinejoin: "round" as const };

/* Five glyphs that stand in for the letter O; each fits the -50..50 viewBox. */
const BLOOM_GLYPHS = [
  // Round five-petal bloom
  <g key="round">
    {PETAL_ANGLES.map((a) => (
      <ellipse key={a} cx="0" cy="-24" rx="15" ry="22" transform={`rotate(${a})`} {...GLYPH_STROKE} />
    ))}
    <circle r="11" fill="var(--petal-deep)" />
    <circle r="4" fill="var(--cream)" />
  </g>,
  // Notched cherry blossom
  <g key="sakura">
    {PETAL_ANGLES.map((a) => (
      <path key={a} d="M0 0C-19 -9 -23 -38 -8 -46L0 -39L8 -46C23 -38 19 -9 0 0Z" transform={`rotate(${a})`} {...GLYPH_STROKE} />
    ))}
    {PETAL_ANGLES.map((a) => (
      <path key={`s${a}`} d="M0 0V-16" transform={`rotate(${a + 36})`} stroke="var(--petal-deep)" strokeWidth="3" strokeLinecap="round" />
    ))}
    <circle r="7" fill="var(--petal-deep)" />
  </g>,
  // Daisy
  <g key="daisy">
    {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => (
      <ellipse key={a} cx="0" cy="-28" rx="7" ry="18" transform={`rotate(${a})`} {...GLYPH_STROKE} strokeWidth={3.5} />
    ))}
    <circle r="14" fill="var(--petal-deep)" />
    <circle r="6" fill="var(--petal)" />
  </g>,
  // Tulip
  <g key="tulip">
    <path d="M-30 -18C-34 -40 -20 -46 -12 -38L0 -48L12 -38C20 -46 34 -40 30 -18C26 22 -26 22 -30 -18Z" {...GLYPH_STROKE} />
    <path d="M0 -48C-10 -30 -10 -4 0 14C10 -4 10 -30 0 -48Z" fill="none" stroke="var(--petal-deep)" strokeWidth="4" strokeLinejoin="round" />
    <path d="M0 14V46M0 34C-10 26 -20 26 -26 30M0 30C10 22 20 22 26 26" fill="none" stroke="var(--petal-deep)" strokeWidth="4.5" strokeLinecap="round" />
  </g>,
  // Lotus, echoing the logo
  <g key="lotus">
    <path d="M0 34C-34 30 -46 4 -44 -16C-26 -14 -8 4 0 34Z" {...GLYPH_STROKE} />
    <path d="M0 34C34 30 46 4 44 -16C26 -14 8 4 0 34Z" {...GLYPH_STROKE} />
    <path d="M0 34C-18 14 -18 -22 0 -46C18 -22 18 14 0 34Z" {...GLYPH_STROKE} />
    <path d="M-26 40H26" stroke="var(--petal-deep)" strokeWidth="4.5" strokeLinecap="round" />
  </g>,
];

/* Letterform flower that morphs into a different bloom every two seconds. */
export function CyclingBloom({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % BLOOM_GLYPHS.length), 2000);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <svg aria-hidden viewBox="-50 -50 100 100" className={`overflow-visible ${className}`}>
      <AnimatePresence initial={false}>
        <motion.g
          key={index}
          initial={{ scale: 0, rotate: -120, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, rotate: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 170, damping: 16 }}
        >
          {BLOOM_GLYPHS[index]}
        </motion.g>
      </AnimatePresence>
    </svg>
  );
}

/* Single-line outline flower; draws itself when its parent svg enters the viewport. */
function LineFlower({
  x,
  y,
  scale = 1,
  delay = 0,
  swayDelay = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  delay?: number;
  swayDelay?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="nf-sway" style={{ animationDelay: `${swayDelay}s` }}>
        {PETAL_ANGLES.map((angle, i) => (
          <motion.path
            key={angle}
            d="M0 0C-12 -12 -12 -30 0 -36C12 -30 12 -12 0 0Z"
            transform={`rotate(${angle})`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6 / scale}
            strokeLinejoin="round"
            variants={draw}
            custom={delay + i * 0.08}
          />
        ))}
        <motion.circle r="4.5" fill="var(--petal)" variants={bloom} custom={delay + 0.5} />
      </g>
    </g>
  );
}

function Leaf({
  x,
  y,
  rotate,
  delay,
  size = 1,
  filled = false,
}: {
  x: number;
  y: number;
  rotate: number;
  delay: number;
  size?: number;
  filled?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size})`}>
      {filled ? (
        <motion.path
          d="M0 0C10 -14 28 -16 40 -8C28 2 12 4 0 0Z"
          fill="currentColor"
          fillOpacity={0.14}
          variants={bloom}
          custom={delay + 0.6}
          style={{ transformBox: "fill-box", transformOrigin: "0% 100%" }}
        />
      ) : null}
      <motion.path
        d="M0 0C10 -14 28 -16 40 -8C28 2 12 4 0 0ZM0 0C14 -5 26 -7 40 -8"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4 / size}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={draw}
        custom={delay}
      />
    </g>
  );
}

/* Filled five-petal bloom for the divider vine; a petal gap faces down so the stem meets the center cleanly. */
function VineBloom({
  x,
  y,
  scale = 1,
  delay = 0,
  swayDelay = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  delay?: number;
  swayDelay?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="nf-sway" style={{ animationDelay: `${swayDelay}s`, transformOrigin: "50% 50%" }}>
        <motion.g variants={bloom} custom={delay} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          {PETAL_ANGLES.map((angle) => (
            <path
              key={angle}
              d="M0 0C-15 -9 -18 -30 -7 -38C-3 -41 3 -41 7 -38C18 -30 15 -9 0 0Z"
              transform={`rotate(${angle})`}
              fill="url(#nf-vine-petal)"
              stroke="var(--petal-deep)"
              strokeWidth={1.4 / scale}
              strokeLinejoin="round"
            />
          ))}
          {PETAL_ANGLES.map((angle) => (
            <path
              key={`inner-${angle}`}
              d="M0 0C-6 -6 -7 -16 0 -21C7 -16 6 -6 0 0Z"
              transform={`rotate(${angle + 36})`}
              fill="#fff4f6"
              fillOpacity={0.55}
            />
          ))}
          {PETAL_ANGLES.map((angle) => (
            <g key={`stamen-${angle}`} transform={`rotate(${angle + 36})`}>
              <path d="M0 0L0 -13" stroke="var(--petal-deep)" strokeWidth={1.2 / scale} strokeLinecap="round" />
              <circle cy={-14} r={1.8} fill="var(--petal-deep)" />
            </g>
          ))}
          <circle r={5.5} fill="var(--petal-deep)" />
          <circle cx={-1.6} cy={-1.6} r={1.6} fill="#fff4f6" fillOpacity={0.8} />
        </motion.g>
      </g>
    </g>
  );
}

/* Closed bud on a short stem tip. */
function VineBud({ x, y, rotate, delay }: { x: number; y: number; rotate: number; delay: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <motion.g variants={bloom} custom={delay} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <path
          d="M0 0C-8 -6 -8 -19 0 -26C8 -19 8 -6 0 0Z"
          fill="url(#nf-vine-petal)"
          stroke="var(--petal-deep)"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
        <path
          d="M0 0C-6 -2 -9 -7 -8 -13M0 0C6 -2 9 -7 8 -13"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinecap="round"
        />
      </motion.g>
    </g>
  );
}

const VINE_PATH = "M-10 92C110 52 230 132 360 92S610 52 720 92S970 132 1080 92S1330 52 1450 92";

const VINE_STEMS = [
  { d: "M360 92C355 74 360 56 372 40", delay: 0.6 },
  { d: "M720 92C713 68 720 46 736 28", delay: 0.8 },
  { d: "M1080 92C1085 74 1080 56 1068 40", delay: 1 },
  { d: "M548 62C546 48 552 38 561 30", delay: 0.7 },
  { d: "M1261 62C1263 48 1257 38 1248 30", delay: 1.1 },
  { d: "M171 92C176 102 174 112 166 116C159 119 154 113 158 108C161 105 165 107 164 110", delay: 0.5 },
  { d: "M900 122C895 132 897 141 905 144C912 146 916 140 912 136C909 133 905 135 906 138", delay: 0.9 },
];

const VINE_LEAVES = [
  { x: 62, y: 80, rotate: -56, size: 0.9 },
  { x: 227, y: 100, rotate: 62, size: 0.8 },
  { x: 437, y: 73, rotate: 44, size: 0.85 },
  { x: 653, y: 73, rotate: -43, size: 0.95 },
  { x: 716, y: 62, rotate: -150, size: 0.65 },
  { x: 789, y: 111, rotate: 223, size: 0.95 },
  { x: 1011, y: 111, rotate: 136, size: 0.85 },
  { x: 1149, y: 73, rotate: 118, size: 0.8 },
  { x: 1376, y: 73, rotate: 236, size: 0.9 },
];

const DRIFT_PETALS = [
  { x: 128, y: 34, rotate: -20, delay: 0 },
  { x: 470, y: 128, rotate: 40, delay: 1.6 },
  { x: 968, y: 40, rotate: -60, delay: 0.8 },
  { x: 1330, y: 132, rotate: 25, delay: 2.4 },
];

/* Full-width blossom vine; sits between page sections. */
export function FlowerLineDivider({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden className={`relative w-full overflow-hidden text-[color:var(--petal-deep)] ${className}`}>
      <motion.svg
        viewBox="0 -30 1440 190"
        preserveAspectRatio="xMidYMid slice"
        className="block aspect-[1440/190] min-h-[96px] w-full"
        initial={reduced ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        <defs>
          <radialGradient id="nf-vine-petal" cx="50%" cy="100%" r="100%">
            <stop offset="0%" stopColor="#fff4f6" />
            <stop offset="60%" stopColor="var(--petal)" />
            <stop offset="100%" stopColor="#e0849c" />
          </radialGradient>
        </defs>

        <motion.path
          d={VINE_PATH}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth="6"
          strokeLinecap="round"
          variants={draw}
          custom={0}
        />
        <motion.path d={VINE_PATH} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" variants={draw} custom={0} />

        {VINE_STEMS.map((stem) => (
          <motion.path
            key={stem.d}
            d={stem.d}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            variants={draw}
            custom={stem.delay}
          />
        ))}

        {VINE_LEAVES.map((leaf, i) => (
          <Leaf key={`${leaf.x}-${leaf.y}`} x={leaf.x} y={leaf.y} rotate={leaf.rotate} size={leaf.size} delay={0.4 + i * 0.1} filled />
        ))}

        <VineBud x={562} y={29} rotate={25} delay={1.5} />
        <VineBud x={1247} y={29} rotate={-25} delay={1.7} />

        <VineBloom x={372} y={38} scale={0.72} delay={1.2} swayDelay={0} />
        <VineBloom x={737} y={24} scale={0.95} delay={1.4} swayDelay={1.5} />
        <VineBloom x={1068} y={38} scale={0.72} delay={1.6} swayDelay={0.8} />

        {DRIFT_PETALS.map((petal) => (
          <g key={`${petal.x}-${petal.y}`} transform={`translate(${petal.x} ${petal.y}) rotate(${petal.rotate})`}>
            <motion.g variants={bloom} custom={1.8 + petal.delay * 0.2}>
              <motion.path
                d="M0 0C-6 -3 -8 -13 -3 -16L0 -14L3 -16C8 -13 6 -3 0 0Z"
                fill="var(--petal)"
                fillOpacity={0.85}
                animate={reduced ? undefined : { y: [0, 6, 0], rotate: [0, 18, 0] }}
                transition={reduced ? undefined : { duration: 6, delay: petal.delay, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>
          </g>
        ))}
      </motion.svg>
    </div>
  );
}

/* Outline sprig that overlaps the hero image edge. */
export function LineSprig({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 180 300"
      className={className}
      initial={reduced ? "show" : "hidden"}
      animate="show"
    >
      <motion.path
        d="M30 296C44 236 40 176 64 126C82 88 100 70 120 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        variants={draw}
        custom={0.4}
      />
      <motion.path
        d="M52 160C78 150 98 140 116 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        variants={draw}
        custom={0.8}
      />
      <Leaf x={40} y={230} rotate={-70} delay={0.9} size={1.1} />
      <Leaf x={44} y={200} rotate={-150} delay={1} size={0.9} />
      <Leaf x={70} y={118} rotate={-120} delay={1.1} size={0.8} />
      <LineFlower x={124} y={46} scale={1.1} delay={1.1} swayDelay={0.4} />
      <LineFlower x={122} y={114} scale={0.7} delay={1.4} swayDelay={1.6} />
    </motion.svg>
  );
}

const BLOSSOMS: Array<{ x: number; y: number; s: number }> = [
  { x: 112, y: 72, s: 1 },
  { x: 158, y: 112, s: 0.7 },
  { x: 282, y: 54, s: 0.95 },
  { x: 224, y: 140, s: 0.62 },
  { x: 334, y: 122, s: 0.7 },
  { x: 384, y: 214, s: 0.8 },
  { x: 498, y: 140, s: 1.05 },
  { x: 470, y: 188, s: 0.58 },
  { x: 272, y: 262, s: 0.85 },
];

const FALLING_PETALS = [
  { x: 180, y: 160, delay: 0, duration: 8 },
  { x: 320, y: 90, delay: 2.2, duration: 9 },
  { x: 440, y: 230, delay: 4.1, duration: 7.5 },
  { x: 250, y: 200, delay: 5.6, duration: 8.5 },
];

function Blossom({ x, y, s, delay }: { x: number; y: number; s: number; delay: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <motion.g variants={bloom} custom={delay} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        {PETAL_ANGLES.map((angle) => (
          <path
            key={angle}
            d="M0 0C-17 -8 -21 -34 -7 -43L0 -37L7 -43C21 -34 17 -8 0 0Z"
            transform={`rotate(${angle})`}
            fill="url(#nf-petal-fill)"
            stroke="var(--petal-deep)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        ))}
        {PETAL_ANGLES.map((angle) => (
          <path
            key={`stamen-${angle}`}
            d="M0 0L0 -15"
            transform={`rotate(${angle + 36})`}
            stroke="var(--petal-deep)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        ))}
        <circle r="6" fill="var(--petal-deep)" />
      </motion.g>
    </g>
  );
}

/* Filled blossom branch that overlaps the footer wordmark. */
export function BlossomBranch({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 600 420"
      className={`overflow-visible ${className}`}
      initial={reduced ? "show" : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      <defs>
        <radialGradient id="nf-petal-fill" cx="50%" cy="90%" r="90%">
          <stop offset="0%" stopColor="#fff4f6" />
          <stop offset="55%" stopColor="var(--petal)" />
          <stop offset="100%" stopColor="#e0849c" />
        </radialGradient>
      </defs>
      <g className="nf-sway" style={{ transformOrigin: "100% 100%", animationDuration: "9s" }}>
        <motion.path
          d="M610 404C524 364 470 302 430 252C390 202 332 172 262 152C202 134 152 112 112 72"
          fill="none"
          stroke="#6b443b"
          strokeWidth="9"
          strokeLinecap="round"
          variants={draw}
          custom={0}
        />
        <motion.path d="M430 252C450 204 470 172 498 140" fill="none" stroke="#6b443b" strokeWidth="5" strokeLinecap="round" variants={draw} custom={0.5} />
        <motion.path d="M262 152C252 112 262 82 282 54" fill="none" stroke="#6b443b" strokeWidth="5" strokeLinecap="round" variants={draw} custom={0.6} />
        <motion.path d="M332 170C322 210 302 240 272 262" fill="none" stroke="#6b443b" strokeWidth="5" strokeLinecap="round" variants={draw} custom={0.7} />
        {BLOSSOMS.map((b, i) => (
          <Blossom key={`${b.x}-${b.y}`} x={b.x} y={b.y} s={b.s} delay={0.8 + i * 0.12} />
        ))}
      </g>
      {!reduced
        ? FALLING_PETALS.map((petal) => (
            <motion.path
              key={`${petal.x}-${petal.y}`}
              d="M0 0C-6 -3 -8 -13 -3 -16L0 -14L3 -16C8 -13 6 -3 0 0Z"
              fill="var(--petal)"
              initial={{ x: petal.x, y: petal.y, opacity: 0, rotate: 0 }}
              animate={{ x: petal.x - 70, y: petal.y + 220, opacity: [0, 1, 1, 0], rotate: 220 }}
              transition={{ duration: petal.duration, delay: petal.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))
        : null}
    </motion.svg>
  );
}
