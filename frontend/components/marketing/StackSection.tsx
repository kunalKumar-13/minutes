import Image from "next/image";
import { Database, Download, Lock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { RAIL, Section, SectionHeading, STARS } from "./primitives";

/**
 * Two trust sections: what a transcript can arrive as and leave as, and what
 * happens to it in between.
 *
 * The connector section is rebuilt to their shape — a pure-black ground, a
 * four-column text row with no boxes around it, and a large gradient panel
 * holding the product underneath. The previous version was four small outlined
 * tiles on lavender, which was half the height and none of the weight.
 *
 * The counts sit in a pill rather than at display size on purpose: at heading
 * weight they read as customer metrics, which we have none of. Each one counts
 * the tools named in its own line, so nothing here is a number we made up.
 *
 * The four lines describe what the ingest pipeline accepts and what an export
 * carries, which is what the product genuinely does with those tools — not a
 * live sync we would have to claim in order to name them.
 */

const GROUPS = [
  {
    count: "4+",
    title: "Meeting platforms",
    body: "Transcript exports from Zoom, Google Meet, Teams and Webex parse into a full meeting, speakers and timing intact.",
  },
  {
    count: "3+",
    title: "Calendars",
    body: "Every conversation is filed with the title, date and attendee list a Google Calendar, Outlook or iCal invite carries.",
  },
  {
    count: "4+",
    title: "Where work happens",
    body: "Notes, decisions and action items come out as Markdown — the shape Slack, Notion, Asana and Jira take a paste in.",
  },
  {
    count: "3+",
    title: "Customer records",
    body: "A call summary is one export away from the account it belongs to in Salesforce, HubSpot or Pipedrive.",
  },
];

export function StackSection() {
  return (
    <section className="relative overflow-hidden bg-black py-20 text-white lg:py-[120px]">
      <div className={cn(RAIL, "relative")}>
        <div className="mx-auto max-w-[760px] text-center">
          <SectionHeading onDark>
            <span className="text-purple-400">Designed</span> To Fit Your Stack
          </SectionHeading>
          <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-400">
            One ingest pipeline takes a transcript from any source — txt, vtt, srt or json — and turns it
            into the same searchable meeting. Your tools stay where they are.
          </p>
        </div>

        {/* Four columns of plain text on black — no boxes, as theirs has. */}
        <div className="mt-16 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <span className="inline-flex rounded bg-white/10 px-2 py-0.5 text-[13px] font-medium text-purple-300">
                {group.count}
              </span>
              <p className="mt-4 text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-white">
                {group.title}
              </p>
              <p className="mt-2 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-400">{group.body}</p>
            </div>
          ))}
        </div>

        {/* The large gradient panel their section closes on. */}
        <div className="relative mt-16 overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#3b1d8f_0%,#5b2fc4_45%,#2b1470_100%)] p-8 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: STARS, backgroundRepeat: "no-repeat" }}
          />
          <div className="relative mx-auto max-w-[760px] overflow-hidden rounded-xl bg-white shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
            <Image
              src="/shot-notes.png"
              alt="AI notes for a meeting: an overview, timestamped chapters and action items"
              width={1122}
              height={904}
              className="w-full"
            />
          </div>
          <p className="relative mx-auto mt-8 max-w-[520px] text-center text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-300">
            Wherever a conversation starts, it ends up here: an overview, timestamped chapters, decisions,
            and action items with an owner and a date.
          </p>
        </div>
      </div>
    </section>
  );
}

const GUARANTEES = [
  {
    icon: <Lock className="size-5" />,
    title: "Sessions you control",
    body: "Every sign-in issues a real token with a real expiry, scoped to that browser and revoked on sign-out.",
  },
  {
    icon: <Shield className="size-5" />,
    title: "Guarded by default",
    body: "Nothing loads until your session checks out — no page, no transcript, not a frame of someone else's meeting.",
  },
  {
    icon: <Database className="size-5" />,
    title: "One place for your data",
    body: "Every meeting, note and action item stays in one workspace you can read, export or back up whole.",
  },
  {
    icon: <Download className="size-5" />,
    title: "Yours to take",
    body: "Export any meeting to Markdown, plain text or JSON, notes and action items included. Nothing is locked in.",
  },
];

export function SecuritySection() {
  return (
    <Section ground="grey">
      <div className="mx-auto max-w-[760px] text-center">
        <SectionHeading>
          Your Conversations, <span className="text-purple-600">Your Data</span>
        </SectionHeading>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
          Your transcripts stay in your workspace. No third-party analytics, no trackers, nothing sold on,
          and nothing sent to a model unless you connect one yourself.
        </p>
      </div>

      <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {GUARANTEES.map((card) => (
          <div key={card.title}>
            <span className="flex size-11 items-center justify-center rounded bg-white text-purple-600 shadow-e1">
              {card.icon}
            </span>
            <p className="mt-5 text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">
              {card.title}
            </p>
            <p className="mt-2 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">{card.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
