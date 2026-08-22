import { CalendarClock, Scissors, SquareCheckBig, Users } from "lucide-react";
import { CtaButton, SectionHeading, Shot } from "./primitives";

/**
 * Everything a meeting leaves behind, in one place.
 *
 * The counts below are the seeded workspace's real totals, not decoration — a
 * number on a marketing page should survive someone opening the app to check.
 */

const STATS = [
  { icon: <SquareCheckBig className="size-4" />, value: "33", label: "Action items", note: "extracted, assigned and tracked" },
  { icon: <Users className="size-4" />, value: "11", label: "People", note: "with talk time and words per minute" },
  { icon: <Scissors className="size-4" />, value: "3", label: "Soundbites", note: "clipped moments with their transcript" },
  { icon: <CalendarClock className="size-4" />, value: "7", label: "Meetings", note: "seeded and immediately searchable" },
];

export function KnowledgeSection() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-[1140px] px-5">
        <div className="max-w-[620px]">
          <SectionHeading>
            All Your Tasks, People &amp; <span className="text-purple-600">Knowledge</span> In One Place
          </SectionHeading>
          <p className="mt-5 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
            Commitments do not stay buried in the meeting they were made in. Every action item across the
            workspace collects on one page, grouped by whoever owes it.
          </p>
        </div>

        <dl className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-purple-25 p-6 ring-1 ring-gray-200">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white text-purple-600 shadow-e1">
                {stat.icon}
              </span>
              <dd className="mt-4 font-display text-[32px] font-medium leading-none tracking-[-0.4px] text-gray-900">
                {stat.value}
              </dd>
              <dt className="mt-2 text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">
                {stat.label}
              </dt>
              <p className="mt-1 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">{stat.note}</p>
            </div>
          ))}
        </dl>

        <Shot
          src="/shot-tasks.png"
          alt="The tasks page, with every action item in the workspace grouped by assignee"
          width={1600}
          height={1000}
          className="mx-auto mt-10 max-w-[960px]"
        />

        <div className="mt-10 text-center">
          <CtaButton>Get Started</CtaButton>
        </div>
      </div>
    </section>
  );
}
