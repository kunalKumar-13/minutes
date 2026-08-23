"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CtaButton, Section, SectionHeading, GROUND } from "./primitives";

/**
 * Their dominant content-section shape, which this page did not have.
 *
 * Heading and lede on the left with the call to action pushed to the right of
 * the same row, a strip of tab pills underneath, then a full-bleed panel of the
 * product that the pills switch between. Two sections use it, so it lives here
 * rather than being written twice.
 *
 * The tabs swap real captures of different screens, not crops of one image —
 * a tab that changes the label but not the panel is worse than no tabs.
 */

export type Tab = { label: string; src: string; alt: string };

export function TabbedShowcase({
  id,
  ground = "white",
  heading,
  lede,
  cta = "Get Started",
  tabs,
}: {
  id?: string;
  ground?: keyof typeof GROUND;
  heading: React.ReactNode;
  lede: string;
  cta?: string | null;
  tabs: Tab[];
}) {
  const [active, setActive] = useState(0);
  const onDark = ground === "dark" || ground === "black";
  const tab = tabs[active];

  return (
    <Section id={id} ground={ground}>
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div className="max-w-[620px]">
          <SectionHeading onDark={onDark}>{heading}</SectionHeading>
          <p
            className={cn(
              "mt-5 max-w-[520px] text-[16px] leading-[1.48] tracking-[-0.16px]",
              onDark ? "text-gray-400" : "text-gray-500",
            )}
          >
            {lede}
          </p>
        </div>
        {cta ? <CtaButton className="shrink-0">{cta}</CtaButton> : null}
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-2">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={cn(
              "rounded px-3 py-2 text-[14px] leading-[20px] transition-colors",
              i === active
                ? onDark
                  ? "bg-white text-gray-900"
                  : "bg-[#1d1145] text-white"
                : onDark
                  ? "bg-white/10 text-gray-300 hover:bg-white/15"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Full-width panel, as theirs is — not an inset thumbnail. */}
      <div
        className={cn(
          "mt-10 overflow-hidden rounded-xl bg-white",
          onDark ? "shadow-[0_24px_70px_rgba(0,0,0,0.5)]" : "shadow-[0_20px_60px_rgba(16,24,40,0.14)]",
        )}
      >
        <Image src={tab.src} alt={tab.alt} width={2800} height={1760} className="w-full" priority={false} />
      </div>
    </Section>
  );
}
