import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CtaButton, GROUND, RAIL, SectionHeading, Shot, STARS } from "./primitives";

/**
 * The repeating feature section.
 *
 * Five sections on this page share one shape — a heading, a line of copy, an
 * optional feature grid or checklist, and a screenshot either beside the copy
 * or beneath it. Expressing that once and passing data beats five files that
 * drift apart the first time the type scale changes.
 */

export interface FeatureSectionProps {
  id?: string;
  ground?: keyof typeof GROUND;
  /** Heading, with the emphasised words already wrapped. */
  heading: React.ReactNode;
  lede?: React.ReactNode;
  cta?: { label: string; href?: string } | null;
  /** Icon + title + body, laid out two across beside the copy. */
  features?: { icon: React.ReactNode; title: string; body: string }[];
  /** A simple ticked list, used where a grid would be too heavy. */
  checklist?: string[];
  shot: { src: string; alt: string; width: number; height: number; fade?: boolean };
  /** `beside` puts the shot in a second column; `below` runs it full width. */
  layout?: "beside" | "below";
  /** Put the shot on the left instead of the right. */
  reversed?: boolean;
  /** Extra top padding, for the section that clears the hero's overhang. */
  clearsOverhang?: boolean;
}

export function FeatureSection({
  id,
  ground = "white",
  heading,
  lede,
  cta = { label: "Get Started" },
  features,
  checklist,
  shot,
  layout = "beside",
  reversed = false,
  clearsOverhang = false,
}: FeatureSectionProps) {
  const onDark = ground === "dark";

  const copy = (
    <div>
      <SectionHeading onDark={onDark}>{heading}</SectionHeading>

      {lede && (
        <p
          className={cn(
            "mt-5 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px]",
            onDark ? "text-gray-400" : "text-gray-500",
          )}
        >
          {lede}
        </p>
      )}

      {cta && (
        <CtaButton href={cta.href} variant="primary" className="mt-7">
          {cta.label}
        </CtaButton>
      )}

      {features && (
        <dl className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title}>
              <span className={onDark ? "text-gray-300" : "text-gray-900"}>{f.icon}</span>
              <dt
                className={cn(
                  "mt-3 text-[16px] font-medium leading-[1.48] tracking-[-0.16px]",
                  onDark ? "text-white" : "text-gray-900",
                )}
              >
                {f.title}
              </dt>
              <dd
                className={cn(
                  "mt-1.5 text-[16px] leading-[1.48] tracking-[-0.16px]",
                  onDark ? "text-gray-400" : "text-gray-500",
                )}
              >
                {f.body}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {checklist && (
        <ul className="mt-8 space-y-3">
          {checklist.map((item) => (
            <li
              key={item}
              className={cn(
                "flex items-start gap-2.5 text-[16px] leading-[1.48] tracking-[-0.16px]",
                onDark ? "text-gray-300" : "text-gray-600",
              )}
            >
              <Check className="mt-1 size-4 shrink-0 text-purple-600" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const picture = (
    <Shot
      {...shot}
      className={cn(
        layout === "below" && "mx-auto mt-10 max-w-[960px]",
        onDark && "ring-white/10",
        layout === "beside" && "mx-auto w-full max-w-[440px]",
      )}
    />
  );

  return (
    <section
      id={id}
      className={cn(
        "relative",
        GROUND[ground],
        clearsOverhang ? "pb-20 pt-40 sm:pt-56 lg:pb-[120px]" : "py-20 lg:py-[120px]",
        onDark && "overflow-hidden",
      )}
    >
      {onDark && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0" style={{ backgroundImage: STARS, backgroundRepeat: "no-repeat" }} />
        </div>
      )}

      <div className={cn(RAIL, "relative")}>
        {layout === "beside" ? (
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className={cn(reversed && "lg:order-2")}>{copy}</div>
            <div className={cn(reversed && "lg:order-1")}>{picture}</div>
          </div>
        ) : (
          <>
            {copy}
            {picture}
          </>
        )}
      </div>
    </section>
  );
}
