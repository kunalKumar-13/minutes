"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CtaButton, Section, SectionHeading } from "./primitives";

/**
 * What each team gets out of a meeting.
 *
 * Rebuilt to their structure: a white ground, a centred heading and CTA, a row
 * of category pills, and a narrow vertical list underneath. The earlier version
 * was a dark horizontal carousel, which was the wrong shape entirely — the rail
 * made the section half the height it should be and buried most of the list
 * off-screen.
 *
 * On the content: this slot on their page is a catalogue of named AI apps. Ours
 * is the same shape filled with things the product actually produces — a row
 * here is one real output (notes, action items, search, analytics, soundbites,
 * comments, export) framed for the team that reaches for it, so a visitor lands
 * on the four General rows and can pivot to their own discipline in a click. A
 * list of app names we do not run would be the one fabrication this section
 * could contain. Each row carries a tint purely so a long list stays scannable.
 */

type Skill = { name: string; body: string; tint: string; cats: string[] };

const SKILLS: Skill[] = [
  { name: "Meeting Overview", body: "A tight paragraph on what the call was for, what got covered, and where it landed.", tint: "bg-purple-400", cats: ["General"] },
  { name: "Timestamped Chapters", body: "The meeting split into titled sections, each one jumping straight to that moment in the transcript.", tint: "bg-indigo-400", cats: ["General"] },
  { name: "Action Items With Owners", body: "Commitments pulled out of the conversation with an owner and a due date. Reassign or reschedule in a click.", tint: "bg-green-400", cats: ["General"] },
  { name: "Decisions On The Record", body: "Every decision the room reached, sitting beside the lines that reached it.", tint: "bg-emerald-400", cats: ["General"] },
  { name: "Objection Recall", body: "Search “too expensive” or “security review” across every call and land on the line where it came up.", tint: "bg-orange-400", cats: ["Sales"] },
  { name: "Talk-Time Check", body: "See what share of the call was you. Talk time and words per minute for everyone who spoke.", tint: "bg-red-400", cats: ["Sales", "Recruiting"] },
  { name: "Sentiment Split", body: "How the conversation felt, broken down across positive, neutral and negative moments.", tint: "bg-cyan-400", cats: ["Sales"] },
  { name: "Soundbites Worth Sharing", body: "Clip the moment the buyer said yes and drop it into the thread, transcript lines attached.", tint: "bg-pink-400", cats: ["Sales", "Recruiting"] },
  { name: "Cited Answers", body: "Ask what a candidate said about ownership and get the answer back with the exact lines behind it.", tint: "bg-violet-400", cats: ["Recruiting", "Engineering"] },
  { name: "Debrief In Threads", body: "Comment on the lines that decided it, so the panel argues in one place instead of four inboxes.", tint: "bg-blue-400", cats: ["Recruiting", "Engineering"] },
  { name: "Recurring Topics", body: "The themes that keep coming back, meeting after meeting, counted from the transcripts themselves.", tint: "bg-teal-400", cats: ["Engineering"] },
  { name: "Straight Into The Ticket", body: "Export any meeting to Markdown, plain text or JSON — notes, decisions and action items included.", tint: "bg-amber-400", cats: ["Engineering"] },
];

const CATEGORIES = ["General", "Sales", "Recruiting", "Engineering"] as const;

export function SkillsSection({ id }: { id?: string }) {
  const [active, setActive] = useState<string>("General");
  const shown = SKILLS.filter((s) => s.cats.includes(active));

  return (
    <Section id={id} ground="white">
      <div className="mx-auto max-w-[760px] text-center">
        <SectionHeading>
          Go <span className="text-purple-600">Beyond Notetaking</span>, Whatever Your Team Does
        </SectionHeading>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
          One transcript answers a different question for every team. Pick yours and see what a meeting
          turns into — every line of it traceable to the moment that produced it.
        </p>
        <div className="mt-9 flex justify-center">
          <CtaButton>Get Started</CtaButton>
        </div>
      </div>

      {/* Category pills. The selected one inverts, as theirs does. */}
      <div className="mt-14 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            aria-pressed={active === cat}
            className={cn(
              "rounded px-3 py-2 text-[14px] leading-[20px] transition-colors",
              active === cat
                ? "bg-[#1d1145] text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <ul className="mx-auto mt-10 flex max-w-[620px] flex-col gap-3">
        {shown.map((skill) => (
          <li
            key={skill.name}
            className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white px-5 py-4"
          >
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg text-white", skill.tint)}>
              <Sparkles className="size-5 fill-current" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">
                {skill.name}
              </p>
              <p className="mt-1 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">{skill.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
