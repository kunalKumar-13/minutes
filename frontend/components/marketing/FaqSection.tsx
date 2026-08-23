"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./primitives";

/**
 * The questions a prospective user actually arrives with.
 *
 * Each answer names a specific behaviour — where a citation points, how an
 * owner is chosen, what leaves the server — because a vague reassurance is
 * worse than no answer here. Someone reading this section is deciding whether
 * to trust the notes, so every claim has to survive being checked in the app.
 */
const FAQS = [
  {
    q: "How accurate are the AI notes?",
    a: "Every line of the notes traces back to the transcript. The overview, the chapters, the decisions and the action items are all drawn from what was actually said, and each one carries the timestamp it came from. Click a chapter or an item and the transcript jumps to that moment, so you can read the sentence behind it in a second.",
  },
  {
    q: "What do I get once a meeting is in?",
    a: "An interactive transcript with speaker attribution and timestamps, sitting beside notes that open with an overview, break the hour into chapters, and pull out decisions and action items. Analytics show talk time, words per minute, sentiment split and the topics that keep coming back. Clip any moment as a soundbite. Dark mode and keyboard shortcuts throughout.",
  },
  {
    q: "How does search work across my meetings?",
    a: "One box searches every word of every meeting in your workspace. Results come back ranked by relevance rather than date, with your terms highlighted in the surrounding line so you can tell the right hit from the near miss without opening anything. Add another word and the results narrow.",
  },
  {
    q: "Can I ask a question instead of searching?",
    a: "Yes. Ask something in plain language — “what did we decide about pricing?” — and you get an answer drawn from across every meeting, with each claim cited back to the transcript lines it came from. Follow a citation and you land on the exact moment someone said it.",
  },
  {
    q: "How do action items find the right owner?",
    a: "From the grammar of the sentence. “I’ll send it” belongs to whoever is speaking. “Can you send it” belongs to whoever is addressed, and a name in the vocative wins over one mentioned later — in “Tomás, can you draft the schema and send it to Daniel?” the owner is Tomás. Dates said out loud become due dates. Reassign or reschedule anything in a click.",
  },
  {
    q: "What can I bring in?",
    a: "Plain text, WebVTT, SubRip and JSON transcripts, in the layouts these formats come in. The ingest pipeline is built to take the transcript exports that Zoom, Google Meet and Microsoft Teams produce. Untimed text works too — timings are reconstructed from a reading rate, so the player and click-to-seek still behave.",
  },
  {
    q: "What languages does it handle?",
    a: "Transcripts in any language are stored, displayed and searched exactly as written — speaker attribution, timestamps, comments and soundbites work the same regardless of language. Notes, action items and question answering are tuned for English meetings.",
  },
  {
    q: "Is my meeting data private?",
    a: "Your transcripts stay in your own workspace and go nowhere else. No third-party analytics, no trackers, no content sold on. Sessions carry a real expiry the API enforces on every request, and you can revoke them from Settings.",
  },
  {
    q: "What can I export?",
    a: "Any meeting exports as Markdown, plain text or JSON — the full transcript with speakers and timestamps, the notes, the action items with their owners and dates. Markdown drops straight into a doc, JSON into whatever you build next.",
  },
  {
    q: "Can my team work on a meeting with me?",
    a: "Everyone in the workspace sees the same meetings, notes and search results. Comment on any line of the transcript and hold the discussion in threads where the words are. Assign an action item to a teammate and it shows up under their name with its due date attached.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-[800px] px-5">
        <SectionHeading className="text-center">Frequently Asked Questions</SectionHeading>

        <dl className="mt-16">
          {FAQS.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div key={faq.q} className="border-b border-gray-100">
                <dt>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-800 transition-colors group-hover:text-gray-900">
                      {faq.q}
                    </span>
                    {/* A plus that turns into a cross, as on the original. */}
                    <Plus
                      className={cn(
                        "size-5 shrink-0 text-gray-900 transition-transform duration-200",
                        isOpen && "rotate-45",
                      )}
                    />
                  </button>
                </dt>
                {isOpen && (
                  <dd className="max-w-[620px] pb-6 pr-12 text-[16px] leading-[1.62] tracking-[-0.16px] text-gray-500">
                    {faq.a}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>

        <p className="mx-auto mt-10 max-w-[560px] text-center text-[16px] leading-[1.62] tracking-[-0.16px] text-gray-500">
          Still deciding? Bring one transcript in and watch the notes, the action items and the
          first search results appear the moment it lands.
        </p>
      </div>
    </section>
  );
}
