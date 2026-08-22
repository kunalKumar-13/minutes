import { cn } from "@/lib/utils";

/**
 * The social-proof strip under the hero.
 *
 * The row scrolls continuously, so the track holds two copies of the list and
 * translates by exactly half its width — at which point copy two sits where
 * copy one started and the animation restarts invisibly. Duplicating in markup
 * rather than cloning at runtime keeps it working with JavaScript disabled.
 *
 * The companies are the fictional ones seeded into this project's own demo
 * workspace. Real marks here would assert that real organisations use this,
 * which is not true — a clone should copy a layout, not borrow customers.
 */

const COMPANIES = [
  { name: "Northwind", suffix: "TRADERS" },
  { name: "LUMINA", suffix: "LABS" },
  { name: "Acme", suffix: "INC" },
  { name: "Beacon", suffix: "HEALTH" },
  { name: "Vantage", suffix: "GROUP" },
  { name: "Meridian", suffix: "CO" },
];

function Wordmark({ name, suffix }: { name: string; suffix: string }) {
  return (
    <span className="flex shrink-0 items-baseline gap-2 opacity-45">
      <span className="font-display text-2xl font-medium tracking-tight text-white">{name}</span>
      <span className="text-xs font-semibold tracking-[0.18em] text-white">{suffix}</span>
    </span>
  );
}

export function LogoMarquee({ className }: { className?: string }) {
  return (
    <section className={cn("bg-[#100730] pb-16 pt-40 sm:pt-56", className)}>
      <div className="mx-auto max-w-[1140px] px-5 text-center">
        <p className="text-[16px] font-semibold uppercase tracking-[0.12em] text-gray-400">
          Built for teams that live in meetings
        </p>
      </div>

      {/* Full-bleed, with the edges faded so wordmarks enter and leave softly. */}
      <div
        className="group relative mt-12 overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        }}
      >
        <div className="flex w-max animate-marquee items-center gap-20 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-20" aria-hidden={copy === 1}>
              {COMPANIES.map((company) => (
                <Wordmark key={`${copy}-${company.name}`} {...company} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-[1140px] px-5 text-center">
        <p className="mx-auto max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
          The organisations above are the fictional ones seeded into the demo workspace.
        </p>
      </div>
    </section>
  );
}
