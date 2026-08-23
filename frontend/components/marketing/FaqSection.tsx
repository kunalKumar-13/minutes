"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./primitives";

/**
 * The questions a prospective user actually arrives with.
 *
 * Geometry is measured off the original rather than chosen: an 796px column,
 * eleven rows on an exact 73px pitch (24px of padding above and below a 25px
 * line), questions at 16px in pure black, and a 1px #f2f4f7 rule under each
 * row with none above the first. The gap between the heading and the first row
 * is 136px — much larger than it looks like it should be, which is most of why
 * an eyeballed version of this section reads as cramped.
 *
 * The question set mirrors theirs topic for topic. The answers are ours: every
 * one names a specific behaviour, because someone reading this is deciding
 * whether to trust the notes, and a vague reassurance is worse than no answer.
 */
const FAQS = [
  {
    q: "What is Fireflies.ai?",
    a: "It turns a meeting into something you can actually use afterwards. Every conversation becomes an interactive transcript with speakers and timestamps, a set of AI notes that opens with an overview and breaks the hour into chapters, and a list of action items with owners. All of it is searchable across your whole workspace the moment the call ends.",
  },
  {
    q: "How is it different from a regular AI notetaker?",
    a: "A notetaker hands you a summary and stops. Here the notes stay attached to the conversation: click any chapter, decision or action item and the transcript jumps to the moment it came from. You can search every meeting at once, ask a question in plain language and get the answer cited back to the lines it was drawn from, and see who actually did the talking.",
  },
  {
    q: "What are AI Skills?",
    a: "A skill reads the transcript and writes the section your team needs from it — an overview, timestamped chapters, action items with owners, the decisions on the record. They are grouped by discipline, so a sales call and a design review each get the notes that matter to them, and every point stays traceable to the line that produced it.",
  },
  {
    q: "How accurate are the AI notes?",
    a: "Every line traces back to the transcript. The overview, the chapters, the decisions and the action items are all drawn from what was said, and each carries the timestamp it came from. Click one and the transcript jumps there, so you can read the sentence behind it in a second rather than taking the summary on faith.",
  },
  {
    q: "What do I get once a meeting is in?",
    a: "An interactive transcript beside notes with an overview, chapters, decisions and action items. Analytics show talk time, words per minute, sentiment split and the topics that keep recurring. Clip any moment as a soundbite, leave threaded comments on a line, and work in dark mode with keyboard shortcuts throughout.",
  },
  {
    q: "Does it work with the tools I already use?",
    a: "Bring a transcript from Zoom, Google Meet or Microsoft Teams and it is parsed on arrival — txt, vtt, srt and json all work, timed or untimed. What comes out goes anywhere: export a meeting as Markdown, plain text or JSON and paste it into Slack, Notion, a ticket or a CRM note.",
  },
  {
    q: "How does search work across my meetings?",
    a: "One box searches every word of every meeting in the workspace. Results come back ranked by relevance rather than date, with your terms highlighted in the surrounding line so you can tell the right hit from the near miss without opening anything. Filter by participant, channel or date to narrow it further.",
  },
  {
    q: "Can I ask a question instead of searching?",
    a: "Yes. Ask in plain language and the answer comes back with the transcript lines behind it. Open a citation and you land on that line in the meeting, so you can always check the answer against what was actually said instead of trusting it.",
  },
  {
    q: "How do action items get an owner?",
    a: "Whoever committed to the work gets it. If someone is addressed by name the item goes to them; otherwise it goes to the person who said it. Every item carries a due date where one was mentioned, and you can reassign or reschedule in a click. Items you add or edit yourself are kept even when the notes are regenerated.",
  },
  {
    q: "Is my data safe?",
    a: "Everything stays in one database beside the API. There are no third-party analytics and no trackers on any page. Sessions carry a real token with an expiry and you can revoke any of them, per browser, at any time. Nothing leaves the server unless you configure a model key yourself.",
  },
  {
    q: "Does it work in other languages?",
    a: "Yes. Transcripts come in in any language and keep their speaker attribution and timestamps, and the notes are written from the same text. Meetings can differ from one another without any setting to change.",
  },
];

export function FaqSection({ id }: { id?: string }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id={id} className="bg-white py-20 lg:py-[120px]">
      {/* 836 minus the 20px gutters is the measured 796px column. */}
      <div className="mx-auto max-w-[836px] px-5">
        <SectionHeading className="text-center">Frequently Asked Questions</SectionHeading>

        <dl className="mt-20">
          {FAQS.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div key={faq.q} className="border-b border-[#f2f4f7]">
                <dt>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    {/* 24 + 25 + 24 = the 73px row they use. */}
                    <span className="text-[16px] leading-[25px] tracking-[-0.16px] text-black">
                      {faq.q}
                    </span>
                    {/* A plus that turns into a cross, as on the original. */}
                    <Plus
                      className={cn(
                        "size-5 shrink-0 text-black transition-transform duration-200",
                        isOpen && "rotate-45",
                      )}
                    />
                  </button>
                </dt>
                {isOpen && (
                  <dd className="max-w-[660px] pb-6 pr-12 text-[16px] leading-[1.62] tracking-[-0.16px] text-gray-500">
                    {faq.a}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
