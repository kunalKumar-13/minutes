"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { SectionHeading } from "./primitives";

/**
 * A horizontally scrollable card rail.
 *
 * Scrolling is native — `overflow-x-auto` with scroll-snap — so it works with a
 * trackpad, a touchscreen and the keyboard before any JavaScript runs. The
 * arrows are a convenience layered on top, and they disable themselves at each
 * end by reading the element's real scroll position rather than tracking an
 * index that could drift out of sync with it.
 *
 * On the content: these are *not* testimonials. Inventing praise from invented
 * people is fabricating reviews, however fictional the names. Each card instead
 * states something the build actually does, attributed to the sample meeting it
 * comes from — checkable against the seeded workspace.
 */

const CARDS = [
  {
    line: "Every commitment in the call is pulled out and attributed to whoever actually made it — including the ones addressed to someone else.",
    source: "Q3 Product Roadmap Planning",
    detail: "5 action items, 4 speakers",
    person: "Priya Raman",
  },
  {
    line: "Clicking any line jumps the player to that moment, and playing scrolls the transcript to follow. One piece of state drives both.",
    source: "Engineering Standup",
    detail: "23 lines, 5m 36s",
    person: "Daniel Okafor",
  },
  {
    line: "Search runs over a real full-text index, so a query returns the lines that matter ranked by relevance rather than the first substring match.",
    source: "QBR — Northwind Traders",
    detail: "renewal · 3 matches",
    person: "Grace Adeyemi",
  },
  {
    line: "The analysis panel counts dates, metrics, tasks and questions from the transcript itself. Selecting one lands on the real lines.",
    source: "Northwind Traders — Discovery Call",
    detail: "9 dates · 5 metrics · 8 questions",
    person: "Sofia Marchetti",
  },
  {
    line: "Regenerating the notes rebuilds the AI-derived items but keeps anything a person typed or ticked off. Provenance makes that rule expressible.",
    source: "Design Review — Checkout Redesign v2",
    detail: "5 action items, 1 completed",
    person: "Mei Lin",
  },
];

export function TestimonialCarousel() {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Read the real scroll position rather than tracking an index, which would
  // drift the moment someone scrolls with a trackpad instead of the buttons.
  const sync = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  const nudge = (direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.min(420, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-[1140px] px-5">
        <div className="text-center">
          <SectionHeading>What This Build Actually Does</SectionHeading>
          <p className="mx-auto mt-5 max-w-[520px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
            Not testimonials — claims you can check against the seeded workspace.
          </p>
        </div>

        <div className="mt-12 flex items-center justify-end gap-2">
          <button
            type="button"
            aria-label="Previous"
            disabled={atStart}
            onClick={() => nudge(-1)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border transition-colors",
              atStart
                ? "border-gray-200 text-gray-300"
                : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={atEnd}
            onClick={() => nudge(1)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border transition-colors",
              atEnd
                ? "border-gray-200 text-gray-300"
                : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Full-bleed rail so cards run to the edge as they scroll away. */}
      <div
        ref={railRef}
        onScroll={sync}
        tabIndex={0}
        role="region"
        aria-label="What this build does"
        className="ff-scroll mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-[max(1.25rem,calc((100vw-1140px)/2))] pb-4"
      >
        {CARDS.map((card) => (
          <article
            key={card.source}
            className="flex w-[340px] shrink-0 snap-start flex-col rounded-2xl bg-purple-25 p-6 ring-1 ring-gray-200 sm:w-[380px]"
          >
            <Quote className="size-5 text-purple-300" />
            <p className="mt-4 flex-1 text-[16px] leading-[1.62] tracking-[-0.16px] text-gray-700">
              {card.line}
            </p>
            <footer className="mt-6 flex items-center gap-3 border-t border-gray-200 pt-4">
              <Avatar name={card.person} size="lg" className="rounded-full" />
              <span className="min-w-0">
                <span className="block truncate text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">
                  {card.source}
                </span>
                <span className="block text-[14px] leading-[1.4] tracking-[-0.16px] text-gray-500">
                  {card.detail}
                </span>
              </span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
