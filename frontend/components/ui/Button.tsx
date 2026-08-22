"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 shadow-e1 disabled:bg-purple-200 dark:disabled:bg-purple-900",
  secondary:
    "bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 shadow-e1 " +
    "dark:bg-ink-500 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-ink-400",
  ghost:
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-e1 disabled:bg-red-200",
  link: "text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-3.5 text-base gap-2",
  lg: "h-11 px-4 text-md gap-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", loading, icon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-70",
        VARIANTS[variant],
        variant === "link" ? "h-auto p-0" : SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 shrink-0 animate-spin" /> : icon}
      {children}
    </button>
  );
});

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  size?: "sm" | "md";
}

/** A square icon-only control. `label` is required — it becomes the a11y name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, label, active, size = "md", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors",
        size === "sm" ? "size-7" : "size-9",
        active
          ? "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
