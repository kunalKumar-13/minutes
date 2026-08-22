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
  white: "bg-white",
  dark: "bg-[#100730] text-white",
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
    <section id={id} className={cn(GROUND[ground], "py-16", className)}>
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
        "font-display text-[32px] font-medium leading-[1.4] tracking-[-0.4px] sm:text-[40px]",
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
        "mt-5 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px]",
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
  className,
}: {
  href?: string;
  children?: React.ReactNode;
  variant?: "primary" | "ghost" | "gradient";
  size?: "md" | "lg";
  className?: string;
}) {
  const tone = {
    primary: "bg-purple-500 text-white hover:bg-purple-600",
    gradient: "bg-cta-purple text-white shadow-e2 hover:opacity-90",
    ghost: "bg-white/10 text-white hover:bg-white/15",
  }[variant];

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg font-medium transition-colors",
        size === "lg" ? "h-12 px-6 text-[16px]" : "h-11 px-5 text-[16px]",
        tone,
        className,
      )}
    >
      {children}
      <ArrowRight className="size-4" />
    </Link>
  );
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
        "overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_rgba(16,24,40,0.16)] ring-1 ring-gray-200",
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
