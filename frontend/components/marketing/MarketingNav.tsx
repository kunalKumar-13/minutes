"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

/** The dropdown labels are inert: this project has no marketing sub-pages. */
const NAV = ["Product", "Solutions", "Integration", "Resources"];
const FLAT = ["Enterprise", "Pricing"];

export function AnnouncementBar() {
  return (
    <div className="flex h-10 items-center justify-center gap-2 bg-purple-500 px-4 text-center text-white">
      <span className="rounded bg-green-300 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-green-900">
        New
      </span>
      <p className="truncate text-[16px] leading-[1.48] tracking-[-0.16px]">
        Interactive transcripts, AI notes and workspace-wide search.
      </p>
      <Link href="/login" className="hidden shrink-0 underline underline-offset-2 sm:inline">
        See now
      </Link>
    </div>
  );
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#100730]">
      <nav className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-8 px-5" aria-label="Main">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logo size={26} />
          <span className="font-display text-lg font-medium text-white">fireflies.ai</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <span key={item} className="flex cursor-default items-center gap-1 text-[16px] font-medium text-gray-200">
              {item}
              <ChevronDown className="size-3.5 text-gray-400" />
            </span>
          ))}
          {FLAT.map((item) => (
            <span key={item} className="cursor-default text-[16px] font-medium text-gray-200">
              {item}
            </span>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <Link
            href="/login"
            className="hidden text-[16px] font-medium text-white transition-opacity hover:opacity-80 sm:inline"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="hidden h-10 items-center rounded-lg bg-white px-4 text-[16px] font-medium text-gray-900 transition-colors hover:bg-gray-100 sm:inline-flex"
          >
            Request Demo
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-lg bg-purple-500 px-4 text-[16px] font-medium text-white transition-colors hover:bg-purple-600"
          >
            Get Started
          </Link>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-white lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-white/10 px-5 py-4 lg:hidden">
          {[...NAV, ...FLAT].map((item) => (
            <span key={item} className="block py-2 text-[16px] text-gray-200">
              {item}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
