import Image from "next/image";
import { Database, Download, Lock, Shield } from "lucide-react";
import { Section, SectionHeading, STARS } from "./primitives";

/**
 * Two trust sections: what this connects to, and what it does with your data.
 *
 * The connector section is rebuilt to their shape — a pure-black ground, a
 * four-column text row with no boxes around it, and a large gradient panel
 * holding the product underneath. The previous version was four small outlined
 * tiles on lavender, which was half the height and none of the weight.
 *
 * The copy still frames these as what the ingest pipeline is built to accept
 * rather than as working integrations, and says plainly that uploading a
 * transcript is what works today. The app labels those surfaces as unbuilt; a
 * landing page that implies otherwise contradicts its own product.
 */

const GROUPS = [
  { count: "4+", title: "Meeting platforms", body: "Zoom, Google Meet, Teams and Webex, once an adapter exists." },
  { count: "3+", title: "Calendars", body: "Google Calendar, Outlook and iCal feeds for auto-join." },
  { count: "4+", title: "Where work happens", body: "Push notes into Slack, Notion, Asana or Jira." },
  { count: "3+", title: "Customer records", body: "Write call summaries back to Salesforce, HubSpot or Pipedrive." },
];

export function StackSection() {
  return (
    <section className="relative overflow-hidden bg-black py-24 text-white">
      <div className="relative mx-auto max-w-[1140px] px-5">
        <div className="mx-auto max-w-[760px] text-center">
          <SectionHeading onDark>
            <span className="text-purple-400">Designed</span> To Fit Your Stack
          </SectionHeading>
          <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-400">
            The ingest pipeline takes a transcript from anywhere, so connecting a source is a matter of
            writing an adapter rather than reworking the app.
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
              alt="A meeting's AI notes, the artefact every connector would carry"
              width={1122}
              height={904}
              className="w-full"
            />
          </div>
          <p className="relative mx-auto mt-8 max-w-[520px] text-center text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-300">
            Uploading a transcript works today. The connectors above are the roadmap, and the app says so
            wherever one would appear.
          </p>
        </div>
      </div>
    </section>
  );
}

const GUARANTEES = [
  { icon: <Lock className="size-5" />, title: "Session control", body: "Tokens issued and revoked per browser, with a real expiry." },
  { icon: <Shield className="size-5" />, title: "Guarded routes", body: "The edge guard runs before any application code." },
  { icon: <Database className="size-5" />, title: "Single store", body: "One SQLite file you can copy, inspect or back up." },
  { icon: <Download className="size-5" />, title: "Full export", body: "Markdown, plain text or JSON. Nothing is locked in." },
];

export function SecuritySection() {
  return (
    <Section ground="grey">
      <div className="mx-auto max-w-[760px] text-center">
        <SectionHeading>
          Your Conversations, <span className="text-purple-600">Your Data</span>
        </SectionHeading>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
          Everything lives in a single database beside the API. No third-party analytics, no trackers, and
          no transcript leaves the server unless you configure a model key yourself.
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
