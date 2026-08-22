"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./primitives";

/**
 * The questions an evaluator actually arrives with.
 *
 * Each answer is specific enough to check against the code — what is real and
 * what is a placeholder, how attribution works, why there is no password. A
 * vague reassurance would be worse than no answer, because it invites someone
 * to open the repository and find it does not hold.
 */
const FAQS = [
  {
    q: "Is this the real Fireflies.ai?",
    a: "No. It is an independent clone built as an engineering assignment, reproducing the product's design and its post-meeting workflows. It is not affiliated with Fireflies.ai, and none of their code was used — the design tokens and layout were measured from the running site, and every line of implementation was written for this project.",
  },
  {
    q: "Does it actually transcribe audio?",
    a: "No, and that is deliberate — speech-to-text is explicitly out of scope for the assignment. Meetings start from a transcript you already have: seeded samples, a block of text you paste, or a file you upload. Everything downstream of that is real.",
  },
  {
    q: "So what is real, and what is a placeholder?",
    a: "Real: transcript parsing, the notes engine, full-text search, every CRUD path, sessions, exports, and the analysis panel. Placeholders, each labelled as such where it appears: live capture, third-party integrations, team sharing, custom AI skills, and the identity check behind sign-in.",
  },
  {
    q: "Where do the AI summaries come from?",
    a: "A deterministic extractive summariser built into the backend. It scores sentences by keyword density and position, splits the meeting into chapters, and extracts commitments using a small grammar of who-owes-what. Set an Anthropic key and Claude writes them instead, into the same shape — the model is an upgrade, never a dependency.",
  },
  {
    q: "How are action items attributed to the right person?",
    a: "By the grammar of the sentence. First person — “I’ll send it” — belongs to whoever is speaking. Second person — “can you send it” — belongs to whoever is addressed, and a name in the vocative position wins over one mentioned later. In “Tomás, can you draft the schema and send it to Daniel?” the owner is Tomás, not Daniel.",
  },
  {
    q: "What transcript formats can I upload?",
    a: "Plain text in four different layouts, WebVTT, SubRip, and JSON in a couple of shapes. Untimed text works too — timings are synthesised from a reading rate so the player and click-to-seek still function. Sample files are in the repository.",
  },
  {
    q: "How does search work?",
    a: "A real SQLite FTS5 index with bm25 ranking, not a substring scan. Every token you type is quoted before it reaches the index, so operators and stray quotes cannot be read as query syntax. A search box narrows as you add words; a question asked of a meeting ORs its content words instead, because no single line contains every word of a question.",
  },
  {
    q: "Is there really no password?",
    a: "Correct. The assignment scopes authentication as a placeholder, so no credential is checked and any provider signs you into the demo workspace. The session behind it is real: a token with an expiry the API validates, revocable from Settings, enforced by middleware before any page renders.",
  },
  {
    q: "Is my data stored anywhere?",
    a: "Everything lives in a single SQLite database beside the API. No third-party analytics, no trackers, and no transcript leaves the server unless you configure a model key yourself. Any meeting exports as Markdown, plain text or JSON.",
  },
  {
    q: "Can I run it myself?",
    a: "Yes — the repository has setup instructions for both halves. The backend creates its schema and seeds a sample workspace on first boot, so a fresh clone is usable immediately with no configuration.",
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
          Still have questions? The{" "}
          <a
            href="https://github.com/kunalKumar-13/minutes#readme"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-purple-700 underline underline-offset-2 hover:text-purple-800"
          >
            README
          </a>{" "}
          covers the architecture, the schema and the reasoning behind both.
        </p>
      </div>
    </section>
  );
}
