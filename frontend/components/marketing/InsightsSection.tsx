"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section, SectionHeading } from "./primitives";

/**
 * Conversation intelligence.
 *
 * Built to their two-column shape: heading, lede and an accordion down the left,
 * a product panel on the right. The previous version stacked a four-column
 * feature row over a full-width screenshot scaled so small nothing in it could
 * be read — the accordion is what lets one topic be explained properly at a time
 * while the panel stays large enough to see.
 *
 * The bar in each open row is drawn from the same numbers the analytics page
 * shows for the sample workspace, so the panel beside it agrees with the copy.
 */

const TOPICS = [
  {
    title: "Speaker talk-time",
    body: "Who held the floor and who never got a word in, as a share of the conversation with words per minute beside it. Measured against each speaker's own talking time, not the length of the call.",
    bars: [
      { label: "Daniel Okafor", pct: 36 },
      { label: "Aisha Bello", pct: 27 },
      { label: "Priya Raman", pct: 21 },
      { label: "Kenji Watanabe", pct: 16 },
    ],
  },
  {
    title: "Sentiment analysis",
    body: "How the conversation broke down across positive, neutral and negative, line by line rather than as one verdict on the whole meeting.",
    bars: [
      { label: "Neutral", pct: 74 },
      { label: "Positive", pct: 13 },
      { label: "Negative", pct: 13 },
    ],
  },
  {
    title: "AI filters",
    body: "Jump straight to the lines that carry a date, a number, a commitment or a question. Every filter is derived from the transcript itself, so the counts move with the meeting.",
    bars: [
      { label: "Date & time", pct: 62 },
      { label: "Tasks", pct: 38 },
      { label: "Questions", pct: 23 },
      { label: "Metrics", pct: 8 },
    ],
  },
  {
    title: "Topic trackers",
    body: "The themes that keep coming back across the workspace, and how meeting volume moves day by day. Useful for spotting what is quietly eating the week.",
    bars: [
      { label: "Onboarding", pct: 48 },
      { label: "Roadmap", pct: 41 },
      { label: "Hiring", pct: 29 },
    ],
  },
];

export function InsightsSection() {
  const [open, setOpen] = useState(0);

  return (
    <Section ground="grey">
      <div className="grid items-start gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <SectionHeading>
            Drive Insights With <span className="text-purple-600">Conversation Intelligence</span>
          </SectionHeading>
          <p className="mt-5 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
            Detailed analytics that show who drove the conversation and what your workspace keeps coming back to.
          </p>

          <div className="mt-10">
            {TOPICS.map((topic, i) => {
              const isOpen = open === i;
              return (
                <div key={topic.title} className="border-b border-gray-200">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(i)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-900">
                      {topic.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-gray-500 transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="pb-6">
                      <p className="max-w-[440px] text-[16px] leading-[1.55] tracking-[-0.16px] text-gray-500">
                        {topic.body}
                      </p>
                      <ul className="mt-5 space-y-2.5">
                        {topic.bars.map((bar) => (
                          <li key={bar.label} className="flex items-center gap-3">
                            <span className="w-[124px] shrink-0 truncate text-[14px] leading-[20px] text-gray-600">
                              {bar.label}
                            </span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                              <span
                                className="block h-full rounded-full bg-purple-500"
                                style={{ width: `${bar.pct}%` }}
                              />
                            </span>
                            <span className="w-9 shrink-0 text-right text-[14px] leading-[20px] tabular-nums text-gray-500">
                              {bar.pct}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* The panel keeps its own size rather than being squeezed under the copy. */}
        <div className="overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_rgba(16,24,40,0.12)]">
          <Image
            src="/shot-analytics-card.png"
            alt="Analytics: talk time by speaker, meeting volume and recurring topics"
            width={1400}
            height={1180}
            className="w-full"
          />
        </div>
      </div>
    </Section>
  );
}
