import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

/**
 * Five dense columns on near-black, two of which stack a second heading
 * underneath — the same shape as the original.
 *
 * Two slots depart from it, both because copying the shape would have meant
 * asserting something untrue. The original's download column carries a QR for
 * its mobile apps; there are none here, so that space carries a code linking to
 * the source. Its bottom bar carries a language switcher and four social
 * accounts; this has neither, and a dead switcher is worse than no switcher.
 */

const COLUMNS = {
  product: [
    "Meetings library", "Interactive transcript", "AI notes & chapters", "Action items",
    "Soundbites", "Workspace search", "Analytics", "Uploads", "Comments", "Exports",
    "Dark mode", "Keyboard shortcuts",
  ],
  useCases: [
    "Sales calls", "Customer QBRs", "Interviews", "Standups",
    "Design reviews", "Retros", "Research", "Hiring debriefs",
  ],
  integrations: [
    "Zoom", "Google Meet", "Microsoft Teams", "Google Calendar",
    "Outlook", "Slack", "Salesforce", "HubSpot",
  ],
  project: ["README", "Architecture", "Database schema", "API reference"],
  learn: ["Design notes", "Layout spec", "Sample transcripts", "Seed data"],
  openIt: ["Open the app", "Sign in", "API docs"],
  help: ["GitHub repository", "Report an issue"],
};

function Column({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[16px] font-semibold leading-[1.48] tracking-[-0.16px] text-white">{title}</p>
      <ul className="mt-5 space-y-2.5">
        {items.map((item) => (
          <li key={item}>
            <span className="text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-400 transition-colors hover:text-white">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#0a0518] pb-10 pt-20">
      <div className="mx-auto max-w-[1140px] px-5">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <Column title="Product" items={COLUMNS.product} />
          <Column title="Use Cases" items={COLUMNS.useCases} />
          <Column title="Integrations" items={COLUMNS.integrations} />

          <div className="space-y-10">
            <Column title="Project" items={COLUMNS.project} />
            <Column title="Learn" items={COLUMNS.learn} />
          </div>

          <div className="space-y-10">
            <div>
              <p className="text-[16px] font-semibold leading-[1.48] tracking-[-0.16px] text-white">Open It</p>
              {/* A real code: it encodes the repository URL and scans. */}
              <div className="mt-5 w-fit rounded-xl bg-white p-2.5">
                <Image
                  src="/qr-repo.png"
                  alt="QR code linking to the source repository on GitHub"
                  width={492}
                  height={492}
                  className="size-[132px]"
                />
              </div>
              <p className="mt-3 max-w-[190px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-400">
                Scan for the source, or open the seeded demo — no signup, no credential.
              </p>
              <ul className="mt-5 space-y-2.5">
                {COLUMNS.openIt.map((item) => (
                  <li key={item}>
                    <span className="text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-400 transition-colors hover:text-white">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <Column title="Help" items={COLUMNS.help} />
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-7">
          <div className="flex items-center gap-3">
            <Logo size={22} />
            <p className="text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
              © {new Date().getFullYear()} An independent Fireflies.ai clone. Not affiliated.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="https://github.com/kunalKumar-13/minutes"
              target="_blank"
              rel="noreferrer"
              aria-label="Source on GitHub"
              className="text-gray-500 transition-colors hover:text-white"
            >
              <Github className="size-4" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500 transition-colors hover:text-white"
            >
              Open the app
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
