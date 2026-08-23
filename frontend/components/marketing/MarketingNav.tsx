"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { RAIL } from "./primitives";

/** The dropdown labels are inert: this project has no marketing sub-pages. */
const NAV = ["Product", "Solutions", "Integration", "Resources"];
const FLAT = ["Enterprise", "Pricing"];

function AnnouncementBar() {
  const [shown, setShown] = useState(true);
  if (!shown) return null;

  return (
    <div className="relative flex h-10 items-center justify-center gap-2 bg-purple-500 px-4 text-center text-white">
      <span className="rounded bg-green-300 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-green-900">
        New
      </span>
      <p className="truncate text-[14px] leading-[1.48] tracking-[-0.16px]">
        Interactive transcripts, AI notes and workspace-wide search.
      </p>
      <Link href="/login" className="hidden shrink-0 text-[14px] underline underline-offset-2 sm:inline">
        See now
      </Link>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => setShown(false)}
        className="absolute right-4 text-white/70 transition-colors hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

/** Tracks the two things the bar reacts to: how far down, and which way. */
function useHeaderScroll() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;

    const read = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 8);
      // A dead zone, or the bar flickers on trackpad jitter and on the rubber
      // banding at either end of the document.
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 160);
        last = y;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return { scrolled, hidden };
}

/**
 * Reproduces the header behaviour measured on theirs, which mine did not have.
 *
 * Theirs is `position: fixed` with a **transparent** ground, so the hero runs
 * up underneath it. Past the fold it does two things at once: the ground turns
 * **white** (`rgb(255,255,255)`), and the whole bar slides out of view on a
 * downward scroll (`translateY(-117px)`) and back in on an upward one, over
 * 250ms on `cubic-bezier(0.22, 1, 0.36, 1)`. Mine was a sticky bar in a solid
 * `#100730`, permanently parked over the content.
 *
 * Because the bar goes white, the links have two measured colour states:
 * `rgba(250,250,253,0.78)` over the hero, `gray-600` on white, with Login
 * moving from `purple-300` to `purple-600`.
 */
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const { scrolled, hidden } = useHeaderScroll();

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        hidden && !open ? "-translate-y-full" : "translate-y-0",
        scrolled ? "bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]" : "bg-transparent",
      )}
    >
      <AnnouncementBar />

      <nav className={cn(RAIL, "flex h-[76px] items-center gap-8")} aria-label="Main">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logo size={26} />
          <span
            className={cn(
              "font-display text-lg font-medium transition-colors",
              scrolled ? "text-gray-900" : "text-white",
            )}
          >
            Minutes
          </span>
        </Link>

        {/* 14px / 500 / DM Sans, not 16px Inter — measured on theirs. */}
        <div className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <span
              key={item}
              className={cn(
                "flex cursor-default items-center gap-1 font-display text-[14px] font-medium transition-colors",
                scrolled ? "text-gray-600" : "text-[rgba(250,250,253,0.78)]",
              )}
            >
              {item}
              <ChevronDown className="size-3.5 opacity-70" />
            </span>
          ))}
          {FLAT.map((item) => (
            <span
              key={item}
              className={cn(
                "cursor-default font-display text-[14px] font-medium transition-colors",
                scrolled ? "text-gray-600" : "text-[rgba(250,250,253,0.78)]",
              )}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <Link
            href="/login"
            className={cn(
              "hidden font-display text-[16px] font-medium transition-colors hover:opacity-80 sm:inline",
              scrolled ? "text-purple-600" : "text-purple-300",
            )}
          >
            Login
          </Link>
          <Link
            href="/login"
            className="hidden h-10 items-center rounded bg-white px-3.5 font-display text-[16px] font-medium text-gray-700 ring-1 ring-inset ring-gray-200 transition-colors hover:bg-gray-50 sm:inline-flex"
          >
            Request Demo
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded bg-purple-500 px-3.5 font-display text-[16px] font-medium text-white transition-colors hover:bg-purple-600"
          >
            Get Started
          </Link>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={cn("rounded-md p-2 transition-colors lg:hidden", scrolled ? "text-gray-900" : "text-white")}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div
          className={cn(
            "border-t px-5 py-4 lg:hidden",
            scrolled ? "border-gray-200 bg-white" : "border-white/10 bg-[#100730]",
          )}
        >
          {[...NAV, ...FLAT].map((item) => (
            <span
              key={item}
              className={cn(
                "block py-2 font-display text-[14px] font-medium",
                scrolled ? "text-gray-600" : "text-[rgba(250,250,253,0.78)]",
              )}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
