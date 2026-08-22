import { cn, TAG_CLASSES } from "@/lib/utils";
import type { AvatarColor } from "@/lib/types";

export interface BadgeProps {
  children: React.ReactNode;
  color?: AvatarColor | "gray";
  className?: string;
  dot?: boolean;
}

export function Badge({ children, color = "gray", className, dot }: BadgeProps) {
  const tone =
    color === "gray"
      ? "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10"
      : TAG_CLASSES[color as AvatarColor];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tone,
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
