"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronDown, Menu, Mic, Moon, Search, Sun, Video } from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { useTheme } from "./ThemeProvider";
import { useSession } from "./SessionProvider";

export interface ContentTopbarProps {
  title: React.ReactNode;
  onCapture?: () => void;
  /** Present only in meeting mode, where the app rail is hidden. */
  onOpenNav?: () => void;
}

/**
 * The 52px bar above the content column: section title on the left, a centred
 * command-style search, and the account cluster on the right.
 */
export function ContentTopbar({ title, onCapture, onOpenNav }: ContentTopbarProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useSession();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const { data: tasks } = useQuery({
    queryKey: queryKeys.tasks({ status: "open" }),
    queryFn: () => api.tasks({ status: "open" }),
  });

  // ⌘K / Ctrl-K focuses search, the shortcut the real app advertises in-place.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="flex h-[56px] shrink-0 items-center gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4">
      {onOpenNav && (
        <IconButton label="Open navigation" onClick={onOpenNav} className="-ml-1">
          <Menu className="size-[18px]" />
        </IconButton>
      )}
      <div className="min-w-0 shrink-0 text-md font-medium text-gray-900 dark:text-gray-100">{title}</div>

      <form onSubmit={submit} className="mx-auto hidden w-full max-w-[420px] md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or keyword"
            aria-label="Search meetings"
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-12 text-base text-gray-900 placeholder:text-gray-500 focus:border-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-100 dark:border-white/10 dark:bg-ink-500 dark:text-gray-100 dark:focus:ring-purple-500/15 [&::-webkit-search-cancel-button]:appearance-none"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-gray-200 px-1.5 py-0.5 text-2xs font-medium text-gray-400 dark:border-white/10">
            ⌘K
          </kbd>
        </div>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 text-base text-gray-500 xl:flex dark:text-gray-400">
          <span className="rounded bg-green-100 px-1.5 py-0.5 text-sm font-semibold tabular-nums text-green-700 dark:bg-green-500/15 dark:text-green-300">
            {tasks?.length ?? 0}
          </span>
          open tasks
        </span>

        <button
          type="button"
          onClick={() => router.push("/upgrade")}
          className="hidden h-9 items-center rounded-md bg-green-100 px-3 text-base font-medium text-green-800 transition-colors hover:bg-green-200 lg:inline-flex dark:bg-green-500/15 dark:text-green-300"
        >
          Upgrade
        </button>

        {/* Split button: the primary action, plus a menu of the other ways in. */}
        <div className="flex items-stretch overflow-hidden rounded-md bg-purple-600 shadow-e1">
          <button
            type="button"
            onClick={onCapture}
            className="inline-flex h-9 items-center gap-2 px-3 text-base font-medium text-white transition-colors hover:bg-purple-700"
          >
            <Video className="size-4" />
            <span className="hidden sm:inline">Capture</span>
          </button>
          <span className="my-1.5 w-px bg-white/25" />
          <Dropdown
            align="end"
            trigger={
              <button
                type="button"
                aria-label="More capture options"
                className="inline-flex h-9 items-center px-1.5 text-white transition-colors hover:bg-purple-700"
              >
                <ChevronDown className="size-4" />
              </button>
            }
            items={[
              { key: "paste", label: "Paste a transcript", onSelect: onCapture },
              { key: "upload", label: "Upload a file", onSelect: () => router.push("/upload") },
              { key: "live", label: "Join a live meeting", onSelect: () => router.push("/status") },
            ]}
          />
        </div>

        <IconButton label="Record a voice note" onClick={() => router.push("/upload")}>
          <Mic className="size-[18px]" />
        </IconButton>

        <IconButton label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={toggle}>
          {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </IconButton>

        <Dropdown
          align="end"
          trigger={
            <IconButton label="Notifications" className="relative">
              <Bell className="size-[18px]" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-ink-800" />
            </IconButton>
          }
          items={[
            { key: "n1", label: `${tasks?.length ?? 0} action items are still open` },
            { key: "n2", label: "Notes are ready for your latest meeting" },
            { key: "n3", label: "Notification settings", separatorBefore: true, onSelect: () => router.push("/settings") },
          ]}
        />

        <Dropdown
          align="end"
          trigger={
            <button type="button" aria-label="Account menu" className={cn("rounded-md transition-opacity hover:opacity-85")}>
              <Avatar name={user?.name ?? "Guest"} color="green" size="lg" className="rounded-md" />
            </button>
          }
          items={[
            { key: "who", label: <span className="text-gray-500">{user?.email ?? "Signed in"}</span>, disabled: true },
            { key: "settings", label: "Settings", separatorBefore: true, onSelect: () => router.push("/settings") },
            { key: "team", label: "Team", onSelect: () => router.push("/team") },
            { key: "theme", label: theme === "dark" ? "Light mode" : "Dark mode", onSelect: toggle },
            { key: "out", label: "Sign out", separatorBefore: true, destructive: true, onSelect: signOut },
          ]}
        />
      </div>
    </header>
  );
}
