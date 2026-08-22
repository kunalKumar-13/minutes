"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CtaButton, Section, SectionHeading } from "./primitives";

/**
 * The skills catalogue.
 *
 * Rebuilt to their structure: a white ground, a centred heading and CTA, a row
 * of category pills, and a narrow vertical list of skills underneath. The
 * earlier version was a dark horizontal carousel, which was the wrong shape
 * entirely — the rail made the section half the height it should be and buried
 * most of the catalogue off-screen.
 *
 * Each row says plainly whether it runs today. Four of these are the built-in
 * notes engine under different names; the rest are prompts this build does not
 * ship, and a page that blurs the two is lying to the reader.
 */

type Skill = { name: string; body: string; tint: string; live: boolean; cats: string[] };

const SKILLS: Skill[] = [
  { name: "Meeting Overview", body: "A paragraph summarising what the call was for and where it landed.", tint: "bg-purple-400", live: true, cats: ["General"] },
  { name: "Timestamped Chapters", body: "The meeting split into titled sections, each linking into the recording.", tint: "bg-indigo-400", live: true, cats: ["General"] },
  { name: "Action Item Extraction", body: "Commitments pulled out and attributed to whoever made them.", tint: "bg-green-400", live: true, cats: ["General", "Engineering"] },
  { name: "Sentiment Split", body: "How the conversation broke down across positive, neutral and negative.", tint: "bg-cyan-400", live: true, cats: ["General", "Sales"] },
  { name: "BANT Qualification", body: "Budget, authority, need and timeline, lifted from a sales call.", tint: "bg-orange-400", live: false, cats: ["Sales"] },
  { name: "Objection Tracker", body: "Every concern the other side raised, in the order they raised it.", tint: "bg-red-400", live: false, cats: ["Sales"] },
  { name: "Churn Risk", body: "The signals in a customer call that suggest they are drifting away.", tint: "bg-pink-400", live: false, cats: ["Sales"] },
  { name: "Follow-Up Draft", body: "The email that should go out after the call, in your voice.", tint: "bg-teal-400", live: false, cats: ["Sales", "General"] },
  { name: "Candidate Scorecard", body: "How an interviewee answered against the rubric you set.", tint: "bg-violet-400", live: false, cats: ["Recruiting"] },
  { name: "Interview Debrief", body: "What each panellist thought, and where they disagreed.", tint: "bg-blue-400", live: false, cats: ["Recruiting"] },
  { name: "Bug Triage", body: "Defects raised in the call, with severity and who owns them.", tint: "bg-amber-400", live: false, cats: ["Engineering"] },
  { name: "Decision Log", body: "Every decision reached, and the reasoning that got there.", tint: "bg-emerald-400", live: false, cats: ["Engineering", "General"] },
];

const CATEGORIES = ["General", "Sales", "Recruiting", "Engineering"] as const;

export function SkillsSection() {
  const [active, setActive] = useState<string>("General");
  const shown = SKILLS.filter((s) => s.cats.includes(active));

  return (
    <Section ground="white">
      <div className="mx-auto max-w-[760px] text-center">
        <SectionHeading>
          Go <span className="text-purple-600">Beyond Notetaking</span> With AI Skills
        </SectionHeading>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
          A skill is a prompt run over a transcript to produce an extra section of notes. Four run today —
          the rest are the shape the feature takes, not something this build ships.
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
              <div className="flex items-center gap-2">
                <p className="text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">
                  {skill.name}
                </p>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[12px] font-medium leading-[1.4]",
                    skill.live ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500",
                  )}
                >
                  {skill.live ? "Runs today" : "Not built"}
                </span>
              </div>
              <p className="mt-1 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">{skill.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
