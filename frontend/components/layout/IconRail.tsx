"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, BarChart3, Bot, Home, Layers, MoreHorizontal, Settings, Sparkles,
  Star, Upload, Users, Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

export interface RailItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  /** Extra paths that should light this item up. */
  match?: string[];
}

/**
 * The 65px rail, in the order the real app lists it. Two groups separated by a
 * divider: what you do every day above, what you configure below.
 */
export const RAIL_PRIMARY: RailItem[] = [
  { href: "/home", label: "Home", icon: <Home className="size-[18px]" /> },
  { href: "/ask-fred", label: "AskFred", shortcut: "⌘J", icon: <Bot className="size-[18px]" /> },
  {
    href: "/notebook/mine-shared",
    label: "Meetings",
    icon: <Video className="size-[18px]" />,
    match: ["/notebook", "/view"],
  },
  { href: "/status", label: "Meeting Status", icon: <Activity className="size-[18px]" /> },
  { href: "/upload", label: "Uploads", icon: <Upload className="size-[18px]" /> },
  { href: "/integrations", label: "Integrations", icon: <Layers className="size-[18px]" /> },
  { href: "/analytics", label: "Analytics", icon: <BarChart3 className="size-[18px]" /> },
];

export const RAIL_SECONDARY: RailItem[] = [
  { href: "/agents", label: "Voice Agents", icon: <Bot className="size-[18px]" /> },
  { href: "/skills", label: "AI Skills", icon: <Sparkles className="size-[18px]" /> },
  { href: "/team", label: "Team", icon: <Users className="size-[18px]" /> },
  { href: "/upgrade", label: "Upgrade", icon: <Star className="size-[18px]" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="size-[18px]" /> },
  { href: "/more", label: "More", icon: <MoreHorizontal className="size-[18px]" /> },
];

export function isRailActive(pathname: string, item: RailItem): boolean {
  const candidates = [item.href, ...(item.match ?? [])];
  return candidates.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function RailLink({ item }: { item: RailItem }) {
  const pathname = usePathname();
  const active = isRailActive(pathname, item);
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 w-10 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-purple-50 text-purple-700"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
      )}
    >
      {item.icon}
      {/* Hover label: the rail has no room for text, so the name lives here. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-[calc(100%+10px)] z-50 hidden whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-e2 group-hover:block"
      >
        {item.label}
        {item.shortcut && <span className="ml-1.5 text-gray-400">{item.shortcut}</span>}
      </span>
    </Link>
  );
}

export function IconRail() {
  return (
    <nav
      aria-label="Main"
      className="flex w-[65px] shrink-0 flex-col items-center border-r border-[var(--app-border)] bg-[var(--app-surface)]"
    >
      <Link href="/home" aria-label="Minutes home" className="flex h-[57px] items-center justify-center">
        <Logo size={26} />
      </Link>

      <div className="flex flex-1 flex-col items-center gap-0.5 overflow-y-auto pb-3">
        {RAIL_PRIMARY.map((item) => (
          <RailLink key={item.href} item={item} />
        ))}
        <div className="my-2 h-px w-8 bg-[var(--app-border)]" />
        {RAIL_SECONDARY.map((item) => (
          <RailLink key={item.href} item={item} />
        ))}
      </div>
    </nav>
  );
}
