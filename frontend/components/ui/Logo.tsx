import { cn } from "@/lib/utils";

/**
 * The workspace mark: a gradient squircle with a geometric "F".
 * Drawn as inline SVG (not an imported asset) so it inherits size and colour
 * from the surrounding layout and stays crisp at 20px in the sidebar.
 */
export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Fireflies workspace"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="ff-mark" x1="32" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7A5AF8" />
          <stop offset="0.42" stopColor="#A165F9" />
          <stop offset="0.74" stopColor="#CF72FA" />
          <stop offset="1" stopColor="#EE46BC" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#ff-mark)" />
      <rect x="9" y="8" width="14" height="4.6" rx="1.6" fill="white" />
      <rect x="9" y="14.2" width="4.6" height="10" rx="1.6" fill="white" />
      <rect x="15.2" y="14.2" width="7.8" height="4.6" rx="1.6" fill="white" fillOpacity="0.72" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-lg font-medium tracking-tight text-gray-900 dark:text-gray-100", className)}>
      Fireflies
    </span>
  );
}
