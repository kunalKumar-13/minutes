import { cn } from "@/lib/utils";
import { RAIL } from "./primitives";

/**
 * The strip under the hero.
 *
 * The row scrolls continuously, so the track holds two copies of the list and
 * translates by exactly half its width — at which point copy two sits where
 * copy one started and the animation restarts invisibly. Duplicating in markup
 * rather than cloning at runtime keeps it working with JavaScript disabled.
 *
 * The scrolling items are the kinds of call the product handles, not company
 * wordmarks. A wall of logos asserts that those organisations use this, which
 * would be an invented customer list — a clone should copy a layout, not borrow
 * customers.
 */

const MEETINGS = [
  "Sales calls",
  "Customer QBRs",
  "User interviews",
  "Standups",
  "Design reviews",
  "Hiring debriefs",
  "Retros",
  "Board updates",
];

function MeetingType({ label }: { label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-5">
      <span className="font-display text-2xl font-medium tracking-tight text-white opacity-45">
        {label}
      </span>
      <span aria-hidden className="size-1.5 rounded-full bg-purple-400/50" />
    </span>
  );
}

export function LogoMarquee({ className }: { className?: string }) {
  return (
    <section className={cn("bg-[#100730] pb-16 pt-40 sm:pt-56", className)}>
      <div className={cn(RAIL, "text-center")}>
        <p className="text-[16px] font-semibold uppercase tracking-[0.12em] text-gray-400">
          Built for teams that live in meetings
        </p>
      </div>

      {/* Full-bleed, with the edges faded so items enter and leave softly. */}
      <div
        className="group relative mt-12 overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        }}
      >
        <div className="flex w-max animate-marquee items-center gap-14 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-14" aria-hidden={copy === 1}>
              {MEETINGS.map((label) => (
                <MeetingType key={`${copy}-${label}`} label={label} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={cn(RAIL, "mt-12 text-center")}>
        <p className="mx-auto max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-400">
          Whatever the call, it lands the same way: an interactive transcript, notes you can act on,
          and answers you can search for months later.
        </p>
      </div>
    </section>
  );
}
