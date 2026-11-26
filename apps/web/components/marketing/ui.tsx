import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-3.5 w-3.5", className)}
    >
      <path d="M4 12 12 4M5.5 4H12v6.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-3.5 w-3.5", className)}
    >
      <path d="M2 8h11M9.5 4.5 13 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

/**
 * One band of the framed column. The top rule carries the square nodes that
 * sit on the two frame hairlines.
 */
export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("frame scroll-mt-16", className)}>
      <div className="rule-nodes">{children}</div>
    </section>
  );
}

/**
 * Two-tone statement: the title in white and the lead in grey, both set at the
 * same size and weight so they read as one sentence (clears.ai section heads).
 * The mono index row above is the artemiilebedev.com table header.
 */
export function SectionHeader({
  index,
  label,
  title,
  lead,
  className,
}: {
  index: string;
  label: string;
  title: ReactNode;
  lead?: string;
  className?: string;
}) {
  return (
    <div className={cn("pad pb-12 pt-14 lg:pb-16 lg:pt-20", className)}>
      <p className="mono-label flex items-center gap-3">
        <span className="h-1.5 w-1.5 rounded-pill bg-spark-300" aria-hidden="true" />
        <span className="text-chalk-500">{index}</span>
        <span>{label}</span>
      </p>
      <h2 className="display mt-7 max-w-[26ch] text-balance text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.12]">
        {title}
      </h2>
      {lead ? (
        <p className="max-w-[40ch] text-balance text-[clamp(1.75rem,3.2vw,2.5rem)] font-normal leading-[1.12] tracking-display text-chalk-400">
          {lead}
        </p>
      ) : null}
    </div>
  );
}

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Field of small square sparks that widens towards the bottom edge, like
 * embers rising from a fire. Positions come from a seeded generator, so the
 * server and the client render the same markup. Purely decorative.
 */
export function Particles({
  count = 260,
  seed = 11,
  className,
}: {
  count?: number;
  seed?: number;
  className?: string;
}) {
  const random = mulberry32(seed);
  const dots = Array.from({ length: count }, () => {
    const depth = 1 - random() ** 1.7;
    const spread = 0.06 + 0.44 * depth;
    const offset = (random() + random() + random()) / 3 - 0.5;
    return {
      left: (0.5 + offset * 2 * spread) * 100,
      top: depth * 100,
      size: random() > 0.72 ? 3 : 2,
      accent: random() > 0.62,
      opacity: 0.4 + random() * 0.6,
      delay: random() * 4.8,
    };
  });

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute", className)}>
      {dots.map((dot, index) => (
        <span
          key={index}
          className={cn(
            "absolute rounded-full motion-safe:animate-twinkle",
            dot.accent ? "bg-spark-300" : "bg-chalk",
          )}
          style={
            {
              left: `${dot.left.toFixed(2)}%`,
              top: `${dot.top.toFixed(2)}%`,
              width: dot.size,
              height: dot.size,
              opacity: Number(dot.opacity.toFixed(2)),
              "--dot-opacity": dot.opacity.toFixed(2),
              animationDelay: `-${dot.delay.toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * Question index: number | question | /show. The summary row inverts to a
 * light bar on hover and keyboard focus.
 */
export function FaqList({
  items,
  show,
  hide,
}: {
  items: { question: string; answer: string }[];
  show: string;
  hide: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <details key={item.question} className="group surface">
          <summary className="focus-ring index-row pad grid min-h-[64px] cursor-pointer list-none grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-4 py-4 sm:grid-cols-[4rem_minmax(0,1fr)_auto] [&::-webkit-details-marker]:hidden">
            <span className="index-dim text-[12px] text-chalk-500">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[17px] leading-snug sm:text-[19px]">{item.question}</span>
            <span className="index-dim mono-label group-open:hidden">/{show}</span>
            <span className="index-dim mono-label hidden group-open:inline">/{hide}</span>
          </summary>
          <div className="pad grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 pb-7 pt-3 sm:grid-cols-[4rem_minmax(0,1fr)]">
            <p className="col-start-2 max-w-[62ch] text-[15px] leading-relaxed text-chalk-400">
              {item.answer}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}

/** Closing band: centred statement and button above a field of sparks. */
export function CtaBand({
  title,
  body,
  button,
  href,
  note,
  children,
}: {
  title: string;
  body: string;
  button: string;
  href: string;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <Section>
      <div className="relative overflow-hidden">
        <Particles className="inset-x-0 bottom-0 h-72 lg:h-[26rem] [mask-image:linear-gradient(to_top,black_45%,transparent)]" />
        <div className="pad relative flex flex-col items-center pb-52 pt-16 text-center lg:pb-64 lg:pt-24">
          {children}
          <h2 className="display mt-6 max-w-[20ch] text-balance text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.06]">
            {title}
          </h2>
          <p className="mt-4 max-w-[34rem] text-[17px] leading-relaxed text-chalk-400">{body}</p>
          <Link href={href} className="btn-hatch focus-ring mt-8">
            {button}
          </Link>
          {note ? (
            <p className="mt-5 text-[13px] leading-relaxed text-chalk-500">{note}</p>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
