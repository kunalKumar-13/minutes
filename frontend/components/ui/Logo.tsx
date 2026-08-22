import { cn } from "@/lib/utils";

/**
 * The Minutes mark.
 *
 * Four rounded bars on the brand gradient: a waveform whose silhouette — tall,
 * short, short, tall — also reads as an M. It borrows the visual language of
 * the product this clones (a gradient squircle at the same radius) without
 * reproducing its trademark, which matters for something sitting in a public
 * repository.
 *
 * Drawn inline rather than imported so it inherits size and colour from the
 * layout and stays crisp at 20px in the rail.
 */
export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Minutes"
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
      <rect x="7" y="8" width="3.6" height="16" rx="1.8" fill="white" />
      <rect x="12.6" y="13" width="3.6" height="6" rx="1.8" fill="white" fillOpacity="0.75" />
      <rect x="18.2" y="13" width="3.6" height="6" rx="1.8" fill="white" fillOpacity="0.75" />
      <rect x="23.8" y="8" width="3.6" height="16" rx="1.8" fill="white" />
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
