"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onSelect?: () => void;
  destructive?: boolean;
  selected?: boolean;
  separatorBefore?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  className?: string;
  menuClassName?: string;
}

/**
 * A click-to-open menu, portalled to the body and positioned against the
 * trigger's viewport rect so it escapes any `overflow: hidden` ancestor.
 */
export function Dropdown({ trigger, items, align = "end", className, menuClassName }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const width = menuRef.current?.offsetWidth ?? 224;
    const height = menuRef.current?.offsetHeight ?? 200;
    // Flip above / clamp horizontally when there isn't room below.
    const top = rect.bottom + height + 8 > window.innerHeight ? rect.top - height - 6 : rect.bottom + 6;
    const rawLeft = align === "end" ? rect.right - width : rect.left;
    setPosition({ top: Math.max(8, top), left: Math.min(Math.max(8, rawLeft), window.innerWidth - width - 8) });
  }, [open, align, items.length]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", () => setOpen(false), true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("inline-flex", className)}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </div>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: position.top, left: position.left }}
            className={cn(
              "ff-surface fixed z-[70] min-w-[208px] animate-scale-in overflow-hidden rounded-lg border py-1 shadow-e4",
              menuClassName,
            )}
          >
            {items.map((item) => (
              <div key={item.key}>
                {item.separatorBefore && <div className="my-1 h-px bg-[var(--app-border)]" />}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    setOpen(false);
                    item.onSelect?.();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    item.destructive
                      ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5",
                  )}
                >
                  {item.icon && <span className="shrink-0 text-gray-400">{item.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.selected && <Check className="size-4 shrink-0 text-purple-600" />}
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

export interface FilterButtonProps {
  label: string;
  value?: string;
  active?: boolean;
}

/** The pill trigger the library filters use. */
export function FilterButton({ label, value, active }: FilterButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-base font-medium transition-colors",
        active
          ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-300"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-ink-500 dark:text-gray-200 dark:hover:bg-ink-400",
      )}
    >
      {label}
      {value && <span className="text-gray-500 dark:text-gray-400">· {value}</span>}
      <ChevronDown className="size-4 text-gray-400" />
    </button>
  );
}
