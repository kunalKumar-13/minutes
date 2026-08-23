import Image from "next/image";
import Link from "next/link";
import { Github } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { RAIL } from "./primitives";

/**
 * Six headings across five columns on pure black — the same shape as theirs.
 *
 * Every value here is measured rather than chosen: the ground is #000000 (not a
 * tinted near-black), padding is 64px top and bottom, headings are 18px/500 DM
 * Sans at -0.36px tracking in #fafafa, and links are 14px/400 Inter on a 20.16px
 * line at 78% white. The link gap and the heading gap are derived from the
 * footer's 799px height against its 17 line-boxes; both land on round steps.
 *
 * Two slots depart from theirs, both because copying the shape would have meant
 * asserting something untrue. Their download column carries a QR for mobile
 * apps; there are none here, so it carries one that resolves to the source. Their
 * bottom bar carries a language switcher and four social accounts; there are no
 * translations and no accounts, and a dead switcher is worse than no switcher.
 */

const COLUMNS = {
  product: [
    "Meetings library", "Interactive transcript", "AI notes & chapters", "Action items",
    "Soundbites", "Workspace search", "Ask your meetings", "Analytics",
    "Uploads", "Comments", "Exports", "Dark mode", "Keyboard shortcuts",
  ],
  useCases: [
    "Sales calls", "Customer QBRs", "Interviews", "Standups",
    "Design reviews", "Retros", "User research", "Hiring debriefs",
  ],
  integrations: [
    "Zoom", "Google Meet", "Microsoft Teams", "Google Calendar",
    "Outlook", "Slack", "Salesforce", "HubSpot",
  ],
  resources: [
    "Getting started", "Transcript formats", "Search & filters", "Exports", "Keyboard shortcuts",
  ],
  learn: ["How AI notes work", "Ask with citations", "Meeting analytics", "Soundbites & clips"],
  getStarted: ["Open the app", "Sign in", "API reference"],
  help: ["Contact us", "Help centre", "Report an issue"],
};

const HEADING = "font-display text-[18px] font-medium leading-[20.16px] tracking-[-0.36px] text-[#fafafa]";
const LINK =
  "text-[14px] leading-[20.16px] text-[rgba(250,250,253,0.78)] transition-colors hover:text-white";

function Column({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className={HEADING}>{title}</h2>
      <ul className="mt-8 space-y-4">
        {items.map((item) => (
          <li key={item}>
            <span className={LINK}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-black py-16">
      <div className={RAIL}>
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-5">
          <Column title="Product" items={COLUMNS.product} />
          <Column title="Use Cases" items={COLUMNS.useCases} />
          <Column title="Integrations" items={COLUMNS.integrations} />

          <div className="space-y-14">
            <Column title="Resources" items={COLUMNS.resources} />
            <Column title="Learn" items={COLUMNS.learn} />
          </div>

          <div className="space-y-14">
            <div>
              <h2 className={HEADING}>Get Started</h2>
              {/* A real code: it encodes the repository URL and scans. */}
              <div className="mt-8 w-fit rounded bg-white p-2">
                <Image
                  src="/qr-repo.png"
                  alt="QR code that opens this project on GitHub"
                  width={492}
                  height={492}
                  className="size-[140px]"
                />
              </div>
              <ul className="mt-6 space-y-4">
                {COLUMNS.getStarted.map((item) => (
                  <li key={item}>
                    <span className={LINK}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Column title="Contact & Help" items={COLUMNS.help} />
          </div>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <p className="text-[14px] leading-[20.16px] text-[rgba(250,250,253,0.78)]">
              © {new Date().getFullYear()} An independent Fireflies.ai clone. Not affiliated.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className={LINK}>
              Open the app
            </Link>
            <a
              href="https://github.com/kunalKumar-13/minutes"
              target="_blank"
              rel="noreferrer"
              aria-label="Source on GitHub"
              className="text-[rgba(250,250,253,0.78)] transition-colors hover:text-white"
            >
              <Github className="size-[18px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
