"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "ff-banner-dismissed";

/**
 * The 40px strip above the whole shell. Dismissal is remembered per browser —
 * a banner that returns on every navigation is worse than no banner.
 */
export function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="relative flex h-10 shrink-0 items-center justify-center gap-2 bg-purple-50 px-10 text-center dark:bg-purple-500/10">
      <p className="truncate text-base text-gray-700 dark:text-gray-300">
        You are eligible for a 7 day business plan free trial.
      </p>
      <Link
        href="/upgrade"
        className="inline-flex shrink-0 items-center gap-1 text-base font-medium text-purple-700 hover:underline dark:text-purple-300"
      >
        Start free trial
        <ArrowRight className="size-3.5" />
      </Link>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          try {
            window.localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* private mode — dismiss for this page view only */
          }
          setVisible(false);
        }}
        className="absolute right-3 rounded p-1 text-gray-500 transition-colors hover:bg-purple-100 hover:text-gray-900 dark:hover:bg-white/10"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
