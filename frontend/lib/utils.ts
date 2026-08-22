import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AvatarColor } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** `754000` -> `12:34`; past an hour, `1:02:34`. */
export function formatTimestamp(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** `3692` -> `1h 1m`; under an hour, `12m`; under a minute, `48s`. */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

/**
 * Meeting-list date, the way the app writes it: "Today · 10:30 AM",
 * "Yesterday · 3:00 PM", then "Mar 15 · 11:30 AM", with the year once it is
 * no longer the current one.
 */
export function formatMeetingDate(iso: string, withTime = true): string {
  const date = parseServerDate(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  let day: string;
  if (dayDiff === 0) day = "Today";
  else if (dayDiff === 1) day = "Yesterday";
  else if (dayDiff > 1 && dayDiff < 7) day = date.toLocaleDateString(undefined, { weekday: "long" });
  else {
    day = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
    });
  }
  return withTime ? `${day} · ${time}` : day;
}

export function formatRelative(iso: string): string {
  const then = parseServerDate(iso).getTime();
  const diff = Date.now() - then;
  const minute = 60_000, hour = 3_600_000, day = 86_400_000;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return parseServerDate(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * The API emits naive UTC datetimes (no trailing `Z`). `new Date()` would read
 * those as local time and shift every timestamp by the viewer's offset, so
 * mark them as UTC before parsing.
 */
export function parseServerDate(iso: string): Date {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso);
  return new Date(hasZone ? iso : `${iso}Z`);
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic tint for a name that has no stored colour (e.g. an assignee). */
export function colorForName(name: string): AvatarColor {
  const palette: AvatarColor[] = [
    "purple", "blue", "pink", "orange", "green", "teal", "indigo", "cyan", "yellow", "red",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

export const AVATAR_CLASSES: Record<AvatarColor, string> = {
  purple: "bg-purple-500 text-white",
  blue: "bg-blue-500 text-white",
  pink: "bg-pink-400 text-white",
  orange: "bg-orange-400 text-white",
  green: "bg-green-500 text-white",
  teal: "bg-teal-500 text-white",
  indigo: "bg-indigo-500 text-white",
  cyan: "bg-cyan-500 text-white",
  yellow: "bg-yellow-400 text-gray-900",
  red: "bg-red-400 text-white",
};

export const TAG_CLASSES: Record<AvatarColor, string> = {
  purple: "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900/25 dark:text-purple-300 dark:ring-purple-800",
  blue: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/25 dark:text-blue-300 dark:ring-blue-800",
  pink: "bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-900/25 dark:text-pink-300 dark:ring-pink-800",
  orange: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900/25 dark:text-orange-300 dark:ring-orange-800",
  green: "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/25 dark:text-green-300 dark:ring-green-800",
  teal: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900/25 dark:text-teal-300 dark:ring-teal-800",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/25 dark:text-indigo-300 dark:ring-indigo-800",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-900/25 dark:text-cyan-300 dark:ring-cyan-800",
  yellow: "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-900/25 dark:text-yellow-300 dark:ring-yellow-800",
  red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/25 dark:text-red-300 dark:ring-red-800",
};

/** Escape a user query before building a highlight RegExp from it. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split `text` into matched / unmatched runs for `query`. Used by every
 * highlighted surface (transcript search, global search, library filter) so
 * they all highlight identically.
 */
export function highlightParts(text: string, query: string): { value: string; match: boolean }[] {
  const terms = query.trim().split(/\s+/).filter((t) => t.length > 1).map(escapeRegExp);
  if (terms.length === 0) return [{ value: text, match: false }];
  const pattern = new RegExp(`(${terms.join("|")})`, "gi");
  return text
    .split(pattern)
    .filter((chunk) => chunk !== "")
    .map((chunk) => ({ value: chunk, match: pattern.test(chunk) && new RegExp(`^(?:${terms.join("|")})$`, "i").test(chunk) }));
}
