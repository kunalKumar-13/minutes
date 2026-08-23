import { MessageSquareQuote, Quote, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CtaButton, Lede, RAIL, SectionHeading, STARS } from "./primitives";

/**
 * The assistant section.
 *
 * The claim here is the cited answer, not a generic chat box: the copy and the
 * rendered exchange are written together so the citations carry the argument.
 * Keep the two in sync — if the copy stops promising a line and a timestamp,
 * the exchange below stops making sense.
 */

const POINTS = [
  {
    icon: <MessageSquareQuote className="size-4" />,
    title: "Ask across every meeting",
    body: "One question, searched against every transcript in your workspace.",
  },
  {
    icon: <Quote className="size-4" />,
    title: "Always cited",
    body: "Every answer links the speaker and timestamp it came from.",
  },
  {
    icon: <ShieldCheck className="size-4" />,
    title: "Grounded in what was said",
    body: "Answers come from your transcripts. Nothing gets invented to fill a gap.",
  },
];

const EXCHANGE = [
  { role: "you", text: "What did we decide about mobile?" },
  {
    role: "fred",
    text: "Mobile was ruled out for the quarter. Only 9% of sessions are mobile web and almost all are read-only, and one designer cannot carry both collaboration and a new surface.",
    cites: [
      { who: "Tomás Ferreira", at: "08:16" },
      { who: "Mei Lin", at: "07:52" },
    ],
  },
];

export function AskSection({ id }: { id?: string }) {
  return (
    <section id={id} className="relative overflow-hidden bg-black py-20 text-white lg:py-[120px]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ backgroundImage: STARS, backgroundRepeat: "no-repeat" }} />
      </div>

      <div className={cn(RAIL, "relative grid items-center gap-16 lg:grid-cols-2")}>
        <div>
          <SectionHeading onDark>
            Ask Anything, <span className="text-purple-400">Get A Cited Answer</span>
          </SectionHeading>
          <Lede onDark>
            Stop scrubbing recordings for the one line that settled it. Ask a question in plain English and get
            an answer drawn from every meeting you have, with the exact lines and timestamps behind it.
          </Lede>

          <dl className="mt-10 space-y-6">
            {POINTS.map((point) => (
              <div key={point.title} className="flex gap-4">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded bg-white/[0.07] text-purple-300">
                  {point.icon}
                </span>
                <div>
                  <dt className="text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-white">
                    {point.title}
                  </dt>
                  <dd className="mt-1 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-400">
                    {point.body}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          <CtaButton variant="primary" className="mt-10">
            Try It For Free
          </CtaButton>
        </div>

        {/* A rendering of a real exchange rather than a screenshot, so the
            citation links read at this size. */}
        <div className="rounded-xl bg-white/[0.06] p-8">
          {EXCHANGE.map((turn) =>
            turn.role === "you" ? (
              <p
                key={turn.text}
                className="ml-auto w-fit max-w-[80%] rounded-xl rounded-br bg-purple-600 px-4 py-2.5 text-[16px] leading-[1.48] tracking-[-0.16px] text-white"
              >
                {turn.text}
              </p>
            ) : (
              <div key={turn.text} className="mt-5">
                <p className="text-[16px] leading-[1.62] tracking-[-0.16px] text-gray-300">{turn.text}</p>
                <div className="mt-4 space-y-2 border-l-2 border-purple-500/40 pl-4">
                  {turn.cites?.map((cite) => (
                    <p key={cite.at} className="text-[14px] leading-[1.4] tracking-[-0.16px]">
                      <span className="font-medium text-gray-400">{cite.who}</span>
                      <span className="ml-2 tabular-nums text-blue-400 underline decoration-blue-500/50 underline-offset-2">
                        {cite.at}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
