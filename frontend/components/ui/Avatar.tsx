import { cn, AVATAR_CLASSES, colorForName, initialsOf } from "@/lib/utils";
import type { AvatarColor } from "@/lib/types";

// Initials render at 12px/500 with a 12px line box in the real app; the chip
// shrinks but the glyph size holds until it genuinely cannot fit.
const SIZES = {
  xs: "size-5 text-[10px] leading-[10px] rounded-xs",
  sm: "size-6 text-[11px] leading-[11px] rounded-sm",
  md: "size-7 text-[12px] leading-[12px] rounded-sm",
  lg: "size-9 text-[12px] leading-[12px] rounded",
  xl: "size-12 text-lg leading-none rounded-lg",
} as const;

export interface AvatarProps {
  name: string;
  color?: AvatarColor;
  size?: keyof typeof SIZES;
  className?: string;
  title?: string;
}

/**
 * A rounded-square initial chip. Fireflies uses a squircle rather than a
 * circle for speakers, which is what keeps a stack of them legible at 24px.
 */
export function Avatar({ name, color, size = "md", className, title }: AvatarProps) {
  return (
    <span
      title={title ?? name}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-medium",
        SIZES[size],
        AVATAR_CLASSES[color ?? colorForName(name)],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

export interface AvatarStackProps {
  people: { id?: string; name: string; color?: AvatarColor }[];
  max?: number;
  size?: keyof typeof SIZES;
  className?: string;
}

export function AvatarStack({ people, max = 3, size = "md", className }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-1">
        {shown.map((person, index) => (
          <Avatar
            key={person.id ?? `${person.name}-${index}`}
            name={person.name}
            color={person.color}
            size={size}
            className="ring-2 ring-white dark:ring-ink-800"
          />
        ))}
      </div>
      {overflow > 0 && (
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">+{overflow}</span>
      )}
    </div>
  );
}
