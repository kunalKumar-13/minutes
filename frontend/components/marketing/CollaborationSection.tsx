import { Command, Download, MessagesSquare } from "lucide-react";
import { Card, CtaButton, Lede, Section, SectionHeading } from "./primitives";

/**
 * The band between the security section and the card rail.
 *
 * Three large tinted panels rather than a four-up grid: the sections either side
 * of it already run four columns, and repeating that a third time flattens the
 * whole stretch of page. Three panels at the measured 12px radius and 32px
 * padding give the run a different rhythm without a different visual language.
 */
const PANELS = [
  {
    tint: "violet" as const,
    icon: <MessagesSquare className="size-5" />,
    title: "Reply where it was said",
    body:
      "Thread a comment on the line that needs one. The discussion stays attached to the words that started it, so nobody has to rebuild the context from memory.",
    meta: "Threaded comments",
  },
  {
    tint: "amber" as const,
    icon: <Download className="size-5" />,
    title: "Take the meeting with you",
    body:
      "Export any conversation to Markdown, plain text or JSON — overview, chapters and action items included — and drop it straight into the doc or the ticket it belongs in.",
    meta: "Markdown · Text · JSON",
  },
  {
    tint: "mint" as const,
    icon: <Command className="size-5" />,
    title: "Built for people in a hurry",
    body:
      "⌘K jumps to search from anywhere and ⌘Enter posts the comment you just typed. Dark mode carries the whole workspace, not just the shell.",
    meta: "Shortcuts · Dark mode",
  },
];

export function CollaborationSection() {
  return (
    <Section ground="light">
      <div className="max-w-[620px]">
        <SectionHeading>
          Finish The Meeting, <span className="text-purple-600">Not The Admin</span>
        </SectionHeading>
        <Lede>
          The follow-up is where meetings usually go to die. Everything that happens after the call —
          the reply, the hand-off, the write-up — happens on the transcript itself.
        </Lede>
      </div>

      <div className="mt-16 grid gap-5 lg:grid-cols-3">
        {PANELS.map((panel) => (
          <Card key={panel.title} tint={panel.tint} className="flex flex-col">
            <span className="flex size-11 items-center justify-center rounded bg-white text-purple-600">
              {panel.icon}
            </span>
            <h3 className="mt-6 font-display text-[20px] font-medium leading-[1.4] tracking-[-0.2px] text-gray-900">
              {panel.title}
            </h3>
            <p className="mt-3 flex-1 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
              {panel.body}
            </p>
            <p className="mt-6 border-t border-black/[0.06] pt-4 text-[14px] font-medium leading-[1.4] tracking-[-0.16px] text-gray-600">
              {panel.meta}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <CtaButton>Get Started</CtaButton>
      </div>
    </Section>
  );
}
