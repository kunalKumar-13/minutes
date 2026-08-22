"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Hash, Inbox, Plus, Search, Star, SquareCheckBig, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const MEETING_LINKS: SidebarLink[] = [
  { href: "/notebook/mine-shared", label: "My Meetings", icon: <Hash className="size-4" /> },
  { href: "/notebook/all", label: "All Meetings", icon: <Inbox className="size-4" /> },
  { href: "/notebook/favorites", label: "Favourites", icon: <Star className="size-4" /> },
  { href: "/notebook/autopilot", label: "Voice Agent Meetings", icon: <Bot className="size-4" /> },
];

const LIBRARY_LINKS: SidebarLink[] = [
  { href: "/tasks", label: "Tasks", icon: <SquareCheckBig className="size-4" /> },
  { href: "/soundbites", label: "Soundbites", icon: <Scissors className="size-4" /> },
];

/**
 * The 250px column between the rail and the content.
 *
 * It is contextual in the real app — Meetings shows it, Home does not — so it
 * is rendered by the page rather than baked into the shell.
 */
export function ChannelSidebar({ tags }: { tags?: { id: string; name: string; meeting_count: number }[] }) {
  const pathname = usePathname();

  const item = (link: SidebarLink) => {
    const active = pathname === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-base transition-colors",
          active
            ? "bg-purple-50 font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5",
        )}
      >
        <span className="shrink-0 text-gray-400">{link.icon}</span>
        <span className="min-w-0 flex-1 truncate">{link.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden w-[250px] shrink-0 flex-col border-r border-[var(--app-border)] bg-gray-25 lg:flex dark:bg-ink-800">
      <div className="px-3 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search channels"
            aria-label="Search channels"
            className="h-9 w-full rounded-md border border-transparent bg-transparent pl-8 pr-2 text-base text-gray-900 placeholder:text-gray-500 focus:border-purple-300 focus:bg-white focus:outline-none dark:text-gray-100 dark:focus:bg-ink-500 [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3" aria-label="Meeting views">
        {MEETING_LINKS.map(item)}
      </nav>

      <div className="mx-3 my-3 h-px bg-[var(--app-border)]" />

      <nav className="flex flex-col gap-0.5 px-3" aria-label="Library">
        {LIBRARY_LINKS.map(item)}
      </nav>

      <div className="ff-scroll mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-2.5 py-1.5 text-base font-medium text-gray-500 dark:text-gray-400">All channels</p>

        {tags && tags.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {tags.map((tag) => {
              const href = `/notebook/all?tag=${encodeURIComponent(tag.name)}`;
              return (
                <Link
                  key={tag.id}
                  href={href}
                  className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-base text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <Hash className="size-3.5 shrink-0 text-gray-400" />
                  <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                  <span className="shrink-0 text-sm tabular-nums text-gray-400">{tag.meeting_count}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <Hash className="mx-auto size-5 text-purple-200" />
            <p className="mt-3 text-base leading-5 text-gray-500 dark:text-gray-400">
              Create channels to organise your conversations
            </p>
          </div>
        )}

        <button
          type="button"
          disabled
          title="Channels are created from a meeting's tags"
          className="mx-auto mt-3 flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-base font-medium text-gray-700 shadow-e1 disabled:opacity-60 dark:border-white/10 dark:bg-ink-500 dark:text-gray-200"
        >
          <Plus className="size-4" />
          Channel
        </button>
      </div>
    </aside>
  );
}
