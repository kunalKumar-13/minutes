"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./Button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

/**
 * A dialog with a focus trap, Escape-to-close and a scroll lock. Rendered
 * through a portal so a modal opened from inside the transcript's scroll
 * container isn't clipped by it.
 */
export function Modal({ open, onClose, title, description, children, footer, size = "md", icon }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    // Focus the first field rather than the close button, so a form modal is
    // immediately typeable.
    const timer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>("input, textarea, select");
      (target ?? panelRef.current)?.focus();
    }, 30);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
      previouslyFocused?.focus?.();
    };
  }, [open, onKeyDown]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-gray-900/40 backdrop-blur-[2px] dark:bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "ff-surface relative flex max-h-[88vh] w-full animate-scale-in flex-col rounded-xl border shadow-e5 outline-none",
          SIZES[size],
        )}
      >
        <header className="flex items-start gap-3 border-b border-[var(--app-border)] px-5 py-4">
          {icon && (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h2>
            {description && <p className="mt-0.5 text-base text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose} size="sm">
            <X className="size-4" />
          </IconButton>
        </header>

        <div className="ff-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-[var(--app-border)] px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  destructive?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = "Confirm", loading, destructive,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md px-3.5 text-base font-medium text-gray-700 ring-1 ring-inset ring-gray-200 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "inline-flex h-9 items-center rounded-md px-3.5 text-base font-medium text-white transition-colors disabled:opacity-70",
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700",
            )}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-base leading-6 text-gray-600 dark:text-gray-300">{message}</p>
    </Modal>
  );
}
