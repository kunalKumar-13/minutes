"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading, STARS } from "./primitives";

/**
 * The skills rail.
 *
 * Same native-scroll approach as the card carousel: `overflow-x-auto` with
 * scroll-snap does the work, and the arrows read the element's real scroll
 * position rather than tracking an index that could drift.
 *
 * Each card says plainly whether it runs today. Three of these are the built-in
 * notes engine under different names; the rest are prompts this build does not
 * ship, and a marketing page that blurs the two is lying to the reader.
 */

const SKILLS = [
  { name: "Meeting Overview", body: "A paragraph summarising what the call was for and where it landed.", tint: "bg-purple-400", live: true },
  { name: "Timestamped Chapters", body: "The meeting split into titled sections, each linking into the recording.", tint: "bg-indigo-400", live: true },
  { name: "Action Item Extraction", body: "Commitments pulled out and attributed to whoever made them.", tint: "bg-green-400", live: true },
  { name: "Sentiment Split", body: "How the conversation broke down across positive, neutral and negative.", tint: "bg-cyan-400", live: true },
  { name: "BANT Qualification", body: "Budget, authority, need and timeline, lifted from a sales call.", tint: "bg-orange-400", live: false },
  { name: "Churn Risk", body: "The signals in a customer call that suggest they are drifting away.", tint: "bg-pink-400", live: false },
  { name: "Objection Tracker", body: "Every concern the other side raised, in the order they raised it.", tint: "bg-red-400", live: false },
  { name: "Follow-Up Draft", body: "The email that should go out after the call, in your voice.", tint: "bg-teal-400", live: false },
];

export function SkillsSection() {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  const nudge = (direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.min(400, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-[#100730] py-16 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ backgroundImage: STARS, backgroundRepeat: "no-repeat" }} />
      </div>

      <div className="relative">
        <div className="mx-auto max-w-[1140px] px-5">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[620px]">
              <SectionHeading onDark>
                Go Beyond Notetaking With <span className="text-purple-400">AI Skills</span>
              </SectionHeading>
              <p className="mt-5 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-400">
                A skill is a prompt run over a transcript to produce an extra section of notes. Four run
                today — the rest are the shape the feature takes, not something this build ships.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous skills"
                disabled={atStart}
                onClick={() => nudge(-1)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border transition-colors",
                  atStart ? "border-white/10 text-white/25" : "border-white/25 text-white hover:bg-white/10",
                )}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="More skills"
                disabled={atEnd}
                onClick={() => nudge(1)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border transition-colors",
                  atEnd ? "border-white/10 text-white/25" : "border-white/25 text-white hover:bg-white/10",
                )}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={railRef}
          onScroll={sync}
          tabIndex={0}
          role="region"
          aria-label="AI skills"
          className="ff-scroll mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[max(1.25rem,calc((100vw-1140px)/2))] pb-4"
        >
          {SKILLS.map((skill) => (
            <article
              key={skill.name}
              className="flex w-[290px] shrink-0 snap-start flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={cn("flex size-11 items-center justify-center rounded-xl text-white", skill.tint)}>
                  <Sparkles className="size-5 fill-current" />
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[12px] font-medium leading-[1.4] tracking-[-0.1px]",
                    skill.live ? "bg-green-400/15 text-green-300" : "bg-white/[0.07] text-gray-400",
                  )}
                >
                  {skill.live ? "Runs today" : "Not built"}
                </span>
              </div>
              <p className="mt-4 text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-white">
                {skill.name}
              </p>
              <p className="mt-1.5 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-400">{skill.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
