import { Database, Download, Lock, Shield } from "lucide-react";
import { SectionHeading } from "./primitives";

/** The four measured card washes, cycled so a grid reads as colour. */
const TINTS = ["bg-[#f4f3ff]", "bg-[#fffaeb]", "bg-[#fdf4ff]", "bg-[#f0fdf9]"];

/**
 * Two trust sections: what this connects to, and what it does with your data.
 *
 * The connector list is framed as what the ingest pipeline is built to accept,
 * not as working integrations, and says plainly that uploading a transcript is
 * what works today. The app already labels those surfaces as unbuilt; a landing
 * page that implies otherwise would be contradicting its own product.
 */

const GROUPS = [
  { title: "Meeting platforms", items: ["Zoom", "Google Meet", "Microsoft Teams", "Webex"] },
  { title: "Calendars", items: ["Google Calendar", "Outlook", "iCal feeds"] },
  { title: "Where work happens", items: ["Slack", "Notion", "Asana", "Jira"] },
  { title: "Customer records", items: ["Salesforce", "HubSpot", "Pipedrive"] },
];

export function StackSection() {
  return (
    <section className="bg-purple-25 py-16">
      <div className="mx-auto max-w-[1140px] px-5 text-center">
        <SectionHeading>
          Designed To Fit <span className="text-purple-600">Your Stack</span>
        </SectionHeading>
        <p className="mx-auto mt-5 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
          The ingest pipeline takes a transcript from anywhere, so connecting a source is a matter of writing
          an adapter rather than reworking the app.
        </p>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GROUPS.map((group, i) => (
            <div
              key={group.title}
              className={`rounded-xl p-8 text-left ${TINTS[i % TINTS.length]}`}
            >
              <p className="text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">
                {group.title}
              </p>
              <ul className="mt-3 space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
          Uploading a transcript works today. The connectors above are the roadmap, and the app says so
          wherever one would appear.
        </p>
      </div>
    </section>
  );
}

const GUARANTEES = [
  { icon: <Lock className="size-4" />, title: "Session control", body: "Issue and revoke per browser." },
  { icon: <Shield className="size-4" />, title: "Guarded routes", body: "Enforced at the edge." },
  { icon: <Database className="size-4" />, title: "Single store", body: "One file you can back up." },
  { icon: <Download className="size-4" />, title: "Full export", body: "Nothing is locked in." },
];

export function SecuritySection() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto grid max-w-[1140px] items-center gap-16 px-5 lg:grid-cols-2">
        <div>
          <SectionHeading>
            Your Conversations, <span className="text-purple-600">Your Data</span>
          </SectionHeading>
          <p className="mt-5 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
            Everything lives in a single database beside the API. No third-party analytics, and no transcript
            leaves the server unless you configure a model key yourself.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Sessions carry a real token and expiry, revocable at any time",
              "The edge guard runs before any application code",
              "No telemetry, no trackers, no third-party scripts",
              "Export everything as Markdown, plain text or JSON",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-600"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-purple-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {GUARANTEES.map((card, i) => (
            <div key={card.title} className={`rounded-xl p-8 ${TINTS[i % TINTS.length]}`}>
              <span className="flex size-10 items-center justify-center rounded bg-white text-purple-600">
                {card.icon}
              </span>
              <p className="mt-4 text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">
                {card.title}
              </p>
              <p className="mt-1 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
