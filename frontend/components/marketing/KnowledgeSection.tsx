import { CalendarClock, Scissors, SquareCheckBig, Users } from "lucide-react";
import { CtaButton, Lede, Section, SectionHeading, Shot } from "./primitives";

/** The four measured card washes, cycled so the grid reads as colour. */
const TINTS = ["bg-[#f4f3ff]", "bg-[#fffaeb]", "bg-[#fdf4ff]", "bg-[#f0fdf9]"];

/**
 * Everything a meeting leaves behind, in one place.
 *
 * Each card names one thing the workspace keeps and what you get to do with it.
 * The title carries the display face so the grid still has four strong anchors
 * across the row.
 */
const CAPABILITIES = [
  {
    icon: <SquareCheckBig className="size-4" />,
    title: "Action items",
    note: "Every commitment is pulled from the transcript with an owner and a due date, then collected on one page grouped by whoever owes it.",
  },
  {
    icon: <Users className="size-4" />,
    title: "People",
    note: "Talk time, words per minute and sentiment for everyone in the room, so you can see who drove the conversation and who never got in.",
  },
  {
    icon: <Scissors className="size-4" />,
    title: "Soundbites",
    note: "Clip the moment that mattered. Each soundbite keeps its transcript lines and its speakers, ready to drop into a thread or a follow-up.",
  },
  {
    icon: <CalendarClock className="size-4" />,
    title: "Meetings",
    note: "Full-text search ranks every meeting in the workspace and highlights the matching lines. Ask a question and get an answer cited to them.",
  },
];

export function KnowledgeSection() {
  return (
    <Section ground="white">
      <div className="max-w-[620px]">
        <SectionHeading>
          All Your Tasks, People &amp; <span className="text-purple-600">Knowledge</span> In One Place
        </SectionHeading>
        <Lede>
          Commitments do not stay buried in the meeting they were made in. Every action item across the
          workspace collects on one page, grouped by whoever owes it.
        </Lede>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITIES.map((item, i) => (
          <div key={item.title} className={`rounded-xl p-8 ${TINTS[i % TINTS.length]}`}>
            <span className="flex size-10 items-center justify-center rounded bg-white text-purple-600">
              {item.icon}
            </span>
            <h3 className="mt-4 font-display text-[20px] font-medium leading-[1.4] tracking-[-0.2px] text-gray-900">
              {item.title}
            </h3>
            <p className="mt-2 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">{item.note}</p>
          </div>
        ))}
      </div>

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
    </Section>
  );
}
