import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Shared building blocks for the marketing page.
 *
 * The type scale here is measured from the original rather than chosen: an H2
 * of 40px on a 56px line at -0.4px tracking, body copy of 16px on a 23.68px
 * line at -0.16px in gray-500. Those pairings live in these components so a
 * section cannot accidentally use a size with the wrong line-height or colour.
 */

/** Alternating page grounds. Light is lavender-tinted, not neutral grey. */
export const GROUND = {
  light: "bg-purple-25",
  grey: "bg-[#f9fafb]",
  offwhite: "bg-[#fcfcfd]",
  white: "bg-white",
  dark: "bg-[#100730] text-white",
  black: "bg-black text-white",
} as const;

export function Section({
  ground = "white",
  className,
  children,
  id,
}: {
  ground?: keyof typeof GROUND;
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn(GROUND[ground], "py-24", className)}>
      <div className="mx-auto max-w-[1140px] px-5">{children}</div>
    </section>
  );
}

export function SectionHeading({
  children,
  className,
  onDark = false,
}: {
  children: React.ReactNode;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <h2
      className={cn(
        "text-balance font-display text-[32px] font-medium leading-[1.4] tracking-[-0.4px] sm:text-[40px]",
        onDark ? "text-white" : "text-gray-900",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Body copy. Measure is capped — the original's never runs past ~626px. */
export function Lede({
  children,
  className,
  onDark = false,
}: {
  children: React.ReactNode;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <p
      className={cn(
        "mt-5 max-w-[480px] text-pretty text-[16px] leading-[1.48] tracking-[-0.16px]",
        onDark ? "text-gray-400" : "text-gray-500",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function CtaButton({
  href = "/login",
  children = "Get Started",
  variant = "primary",
  size = "md",
  arrow = true,
  className,
}: {
  href?: string;
  children?: React.ReactNode;
  variant?: "primary" | "ghost" | "outline" | "white";
  size?: "md" | "lg";
  arrow?: boolean;
  className?: string;
}) {
  const tone = {
    primary: "bg-purple-500 text-white hover:bg-purple-600",
    // Measured on dark: a near-white wash at 14%, over a 8% white hairline.
    // The border is what stops it dissolving into the ground — dropping it, as
    // an earlier pass did, is why the secondary button read as a grey smudge.
    ghost: "bg-[rgba(241,241,249,0.14)] text-white ring-1 ring-inset ring-white/[0.08] hover:bg-[rgba(241,241,249,0.2)]",
    outline: "text-white ring-1 ring-inset ring-white/30 hover:bg-white/10",
    white: "bg-white text-gray-900 ring-1 ring-inset ring-gray-200 hover:bg-gray-50",
  }[variant];

  return (
    <Link
      href={href}
      className={cn(
        // 4px, not 8px. Their entire page uses a 4px radius on controls — 46 of
        // 68 rounded boxes — and DM Sans, not the body face.
        "inline-flex items-center justify-center gap-2 rounded font-display text-[16px] font-medium transition-colors",
        size === "lg" ? "h-12 px-3.5 py-3" : "h-10 px-3.5 py-2",
        tone,
        className,
      )}
    >
      {children}
      {arrow ? <ArrowRight className="size-4" /> : null}
    </Link>
  );
}

/**
 * A feature panel.
 *
 * Measured off theirs: 12px radius, 32px padding, a soft tinted ground, and
 * **no border and no shadow**. Mine were white boxes with a grey hairline,
 * which is what made the page read as a wireframe — their colour comes from
 * broad washes, not outlines.
 */
export const TINT = {
  violet: "bg-[#f4f3ff]",
  amber: "bg-[#fffaeb]",
  fuchsia: "bg-[#fdf4ff]",
  mint: "bg-[#f0fdf9]",
  sky: "bg-[#f0f9ff]",
  night: "bg-[#0e0539] text-white",
} as const;

export function Card({
  tint = "violet",
  className,
  children,
}: {
  tint?: keyof typeof TINT;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("rounded-xl p-8", TINT[tint], className)}>{children}</div>;
}

/**
 * A framed screenshot of the running app.
 *
 * Real captures rather than drawn mocks: it fills the section honestly, and
 * every pixel is the product actually rendering.
 */
export function Shot({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_rgba(16,24,40,0.16)]",
        className,
      )}
    >
      <Image src={src} alt={alt} width={width} height={height} priority={priority} className="w-full" />
    </div>
  );
}

/** Icon + title + body, the unit the feature grids are built from. */
export function FeatureItem({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-gray-900">{icon}</span>
      <p className="mt-3 text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">{title}</p>
      <p className="mt-1.5 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">{children}</p>
    </div>
  );
}

/** The starfield behind every dark section, drawn rather than fetched. */
export const STARS = [
  ["8%", "14%", 1, 0.45], ["17%", "31%", 1, 0.3], ["23%", "9%", 1.5, 0.5],
  ["31%", "48%", 1, 0.35], ["38%", "18%", 1, 0.4], ["44%", "63%", 1.5, 0.3],
  ["52%", "12%", 1, 0.45], ["58%", "39%", 1, 0.28], ["64%", "71%", 1.5, 0.4],
  ["71%", "22%", 1, 0.5], ["77%", "55%", 1, 0.3], ["83%", "16%", 1.5, 0.42],
  ["89%", "44%", 1, 0.35], ["94%", "27%", 1, 0.3], ["12%", "67%", 1, 0.32],
  ["27%", "79%", 1.5, 0.28], ["49%", "86%", 1, 0.3], ["68%", "8%", 1, 0.38],
  ["86%", "77%", 1, 0.26], ["4%", "42%", 1, 0.34],
]
  .map(([x, y, r, a]) => `radial-gradient(${r}px ${r}px at ${x} ${y}, rgba(255,255,255,${a}), transparent)`)
  .join(", ");

/**
 * A tinted card framing a white product panel.
 *
 * This is the shape most of their content sections are built from: a wash of
 * colour with the real UI floating inside it, rather than a screenshot sitting
 * bare on the page. The panel is deliberately taller than its frame and clipped,
 * so it reads as a window onto the app instead of a cropped image.
 */
export function PanelCard({
  tint = "violet",
  title,
  body,
  children,
  className,
}: {
  tint?: keyof typeof TINT;
  title?: string;
  body?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-xl p-8", TINT[tint], className)}>
      {title ? (
        <p className="text-[20px] font-medium leading-[1.2] tracking-[-0.2px] text-gray-900">{title}</p>
      ) : null}
      {body ? (
        <p className="mt-2 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">{body}</p>
      ) : null}
      <div className="relative mt-7 flex-1">
        <div className="h-[330px] overflow-hidden rounded-lg bg-white shadow-[0_8px_28px_rgba(16,24,40,0.10)]">
          {children}
        </div>
      </div>
    </div>
  );
}
