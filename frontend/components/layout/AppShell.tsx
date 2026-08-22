"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PanelRightOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";
import { AnnouncementBar } from "./AnnouncementBar";
import { AskFredPanel } from "./AskFredPanel";
import { ContentTopbar } from "./ContentTopbar";
import { IconRail } from "./IconRail";

export interface AppShellProps {
  /** Shown at the left of the content top bar. */
  title: React.ReactNode;
  children: React.ReactNode;
  /** The 250px contextual column. Meetings passes one; Home does not. */
  sidebar?: React.ReactNode;
  /** The assistant column, off by default on focused surfaces. */
  askFred?: boolean;
  onCapture?: () => void;
  /** Detail views manage their own internal scrolling. */
  scroll?: boolean;
  /**
   * Meeting mode: the app rail collapses behind a hamburger so the meeting's
   * own rail and panels get the width. This is what the real product does on a
   * meeting page, and it is why the two rails never appear side by side.
   */
  chromeless?: boolean;
  /** Rendered flush against the bottom of the shell, below the content. */
  footer?: React.ReactNode;
}

/**
 * The application chrome, laid out to the measurements in
 * `docs/app-layout-spec.md`: a 40px announcement bar over a 65px icon rail, an
 * optional 250px contextual sidebar, the content column under a 52px top bar,
 * and an optional 400px assistant panel on the right.
 */
export function AppShell({
  title, children, sidebar, askFred = false, onCapture, scroll = true, chromeless = false, footer,
}: AppShellProps) {
  const [fredOpen, setFredOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setNavOpen(false), [pathname]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--app-bg)]">
      <AnnouncementBar />

      <div className="flex min-h-0 flex-1">
        {!chromeless && <div className="hidden md:flex"><IconRail /></div>}
        {sidebar}

        {/* Overlay nav: the only way to the app rail in meeting mode, and the
            small-screen fallback everywhere else. */}
        {navOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-gray-900/40" onClick={() => setNavOpen(false)} />
            <div className="relative animate-slide-in-right">
              <IconRail />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setNavOpen(false)}
                className="absolute left-[73px] top-3 rounded-sm bg-white p-1.5 text-gray-600 shadow-e2 dark:bg-ink-500 dark:text-gray-300"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <ContentTopbar
            title={title}
            onCapture={onCapture}
            onOpenNav={chromeless ? () => setNavOpen(true) : undefined}
          />
          <main className={cn("min-h-0 flex-1", scroll ? "ff-scroll overflow-y-auto" : "overflow-hidden")}>
            {children}
          </main>
          {footer}
        </div>

        {askFred &&
          (fredOpen ? (
            <AskFredPanel onClose={() => setFredOpen(false)} />
          ) : (
            <div className="hidden shrink-0 border-l border-[var(--app-border)] p-2 xl:block">
              <IconButton label="Show assistant" onClick={() => setFredOpen(true)}>
                <PanelRightOpen className="size-[18px]" />
              </IconButton>
            </div>
          ))}
      </div>
    </div>
  );
}
