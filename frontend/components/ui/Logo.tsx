import { cn } from "@/lib/utils";

/**
 * The workspace mark: a gradient squircle with a geometric "M".
 *
 * Drawn as inline SVG rather than an imported asset so it inherits size and
 * colour from the layout and stays crisp at 20px in the rail. It is an original
 * drawing in the same visual language as the product this clones, rather than a
 * copy of their trademark. One round-jointed stroke rather than assembled bars:
 * at 26px in the nav, three separate uprights read as a chart, not a letter.
 */
export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Workspace home"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="minutes-mark" x1="32" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7A5AF8" />
          <stop offset="0.42" stopColor="#A165F9" />
          <stop offset="0.74" stopColor="#CF72FA" />
          <stop offset="1" stopColor="#EE46BC" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#minutes-mark)" />
      <path
        d="M9.8 23.4V10.2L16 18l6.2-7.8v13.2"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-appDisplay text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100",
        className,
      )}
    >
      Minutes
    </span>
  );
}
