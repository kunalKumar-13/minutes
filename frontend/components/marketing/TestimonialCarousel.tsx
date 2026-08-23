"use client";

import { useCallback, useRef, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lightbulb,
  ListChecks,
  Scissors,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RAIL, SectionHeading } from "./primitives";

/** The four measured card washes, cycled so the rail reads as colour. */
const TINTS = ["bg-[#f4f3ff]", "bg-[#fffaeb]", "bg-[#fdf4ff]", "bg-[#f0fdf9]"];

/**
 * A horizontally scrollable card rail.
 *
 * Scrolling is native — `overflow-x-auto` with scroll-snap — so it works with a
 * trackpad, a touchscreen and the keyboard before any JavaScript runs. The
 * arrows are a convenience layered on top, and they disable themselves at each
 * end by reading the element's real scroll position rather than tracking an
 * index that could drift out of sync with it.
 *
 * On the content: these cards are capabilities, not testimonials. Inventing
 * praise from invented people is fabricating reviews however fictional the
 * names are, so each card sells one thing the product does and is labelled with
 * the surface it lives on rather than a quoted person.
 */

const CARDS: { title: string; line: string; label: string; icon: LucideIcon }[] = [
  {
    title: "A transcript you can navigate",
    line: "Every line is attributed to a speaker and stamped with its moment in the call. Click a line to jump the player there; play it back and the transcript follows along.",
    label: "Transcript",
    icon: FileText,
  },
  {
    title: "Notes you never have to write",
    line: "An overview, timestamped chapters, the decisions that landed and the commitments that were made — structured from the conversation itself, not a summary you have to rewrite.",
    label: "AI notes",
    icon: Sparkles,
  },
  {
    title: "Commitments that keep their owner",
    line: "Action items come out with an assignee and a due date attached, including the ones handed to someone who wasn't speaking. Tick them off as the work lands.",
    label: "Action items",
    icon: ListChecks,
  },
  {
    title: "Search that reads every word",
    line: "One query runs across the whole workspace. Results come back ranked by relevance with the matching phrases highlighted in place, so you land on the line you meant.",
    label: "Search",
    icon: Search,
  },
  {
    title: "Ask across every meeting",
    line: "Ask what a customer said about pricing and get an answer drawn from your meetings, cited back to the exact transcript lines it came from. Open a citation and you land on the line.",
    label: "Ask",
    icon: Lightbulb,
  },
  {
    title: "See how the room talked",
    line: "Talk time per speaker, words per minute, the sentiment split and the topics that keep coming back — the shape of a conversation, measured from the transcript.",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    title: "Share the moment, not the hour",
    line: "Clip a soundbite from any stretch of the call, thread comments on the lines that need a reply, and export the whole meeting to Markdown, plain text or JSON.",
    label: "Soundbites",
    icon: Scissors,
  },
];

export function TestimonialCarousel({ id }: { id?: string }) {
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
    <section id={id} className="bg-white py-20 lg:py-[120px]">
      <div className={RAIL}>
        <div className="text-center">
          <SectionHeading>Everything The Meeting Said, In One Place</SectionHeading>
          <p className="mx-auto mt-5 max-w-[520px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
            The words, the decisions, the follow-ups and the numbers behind them — all searchable
            the moment the call ends.
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

        {/* The rail sits inside the page container so the first card lines up
            with the heading above it. */}
        <div
          ref={railRef}
          onScroll={sync}
          tabIndex={0}
          role="region"
          aria-label="Product capabilities"
          className="ff-scroll mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4"
        >
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
          <article
            key={card.title}
            className={`flex w-[340px] shrink-0 snap-start flex-col rounded-xl p-8 sm:w-[380px] ${TINTS[i % TINTS.length]}`}
          >
            <h3 className="font-display text-[20px] font-medium leading-[1.4] tracking-[-0.2px] text-gray-900">
              {card.title}
            </h3>
            <p className="mt-3 flex-1 text-[16px] leading-[1.62] tracking-[-0.16px] text-gray-700">
              {card.line}
            </p>
            {/* The label names the surface the capability lives on — an honest
                stand-in for the attribution line a testimonial would carry. */}
            <footer className="mt-6 flex items-center gap-2.5 border-t border-black/[0.06] pt-4">
              <Icon className="size-4 shrink-0 text-gray-500" />
              <span className="truncate text-[14px] font-medium leading-[1.4] tracking-[-0.16px] text-gray-600">
                {card.label}
              </span>
            </footer>
          </article>
          );
          })}
        </div>
      </div>
    </section>
  );
}
