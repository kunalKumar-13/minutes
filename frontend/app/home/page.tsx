"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, CalendarClock, CheckCircle2, Info, MessageSquare, Rss,
  Settings2, Sparkles, SquareCheckBig,
} from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import { cn, formatMeetingDate } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { useSession } from "@/components/layout/SessionProvider";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { CreateMeetingModal } from "@/components/meetings/CreateMeetingModal";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

const ASSISTANTS = [
  {
    key: "brief",
    name: "Daily Brief",
    icon: <Rss className="size-4" />,
    tint: "bg-gradient-to-br from-indigo-300 to-indigo-400",
  },
  {
    key: "prep",
    name: "Meeting Prep",
    icon: <CalendarClock className="size-4" />,
    tint: "bg-gradient-to-br from-pink-200 to-pink-300",
  },
] as const;

/** Slack + Gmail marks, inline so the banner needs no network. */
function SlackMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#E01E5A" d="M5 15a2 2 0 1 1-2-2h2v2Zm1 0a2 2 0 1 1 4 0v5a2 2 0 1 1-4 0v-5Z" />
      <path fill="#36C5F0" d="M9 5a2 2 0 1 1 2-2v2H9Zm0 1a2 2 0 1 1 0 4H4a2 2 0 1 1 0-4h5Z" />
      <path fill="#2EB67D" d="M19 9a2 2 0 1 1 2 2h-2V9Zm-1 0a2 2 0 1 1-4 0V4a2 2 0 1 1 4 0v5Z" />
      <path fill="#ECB22E" d="M15 19a2 2 0 1 1-2 2v-2h2Zm0-1a2 2 0 1 1 0-4h5a2 2 0 1 1 0 4h-5Z" />
    </svg>
  );
}

function GmailMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M2 6.5A1.5 1.5 0 0 1 3.5 5H4l8 6 8-6h.5A1.5 1.5 0 0 1 22 6.5V18a1 1 0 0 1-1 1h-2V9.7l-7 5.2-7-5.2V19H3a1 1 0 0 1-1-1V6.5Z" />
      <path fill="#EA4335" d="M2 6.5A1.5 1.5 0 0 1 3.5 5H4l8 6-2 1.5L2 7.2V6.5Z" />
      <path fill="#FBBC04" d="M22 6.5V7.2l-8 5.3L12 11l8-6h.5A1.5 1.5 0 0 1 22 6.5Z" />
    </svg>
  );
}

type HomeTab = "recent" | "upcoming" | "feed";

export default function HomePage() {
  const { user } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<HomeTab>("recent");
  const [createOpen, setCreateOpen] = useState(false);

  const filters = { page_size: 6, sort: "recent" as const };
  const meetingsQuery = useQuery({ queryKey: queryKeys.meetings(filters), queryFn: () => api.meetings(filters) });
  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks({ status: "open" }),
    queryFn: () => api.tasks({ status: "open" }),
  });

  const meetings = meetingsQuery.data?.items ?? [];
  const openTasks = tasksQuery.data ?? [];

  return (
    <AppShell title="Home" askFred onCapture={() => setCreateOpen(true)}>
      {/* The soft gradient wash behind the greeting, as on the real Home. */}
      <div className="bg-home-wash dark:bg-home-wash-dark">
        <div className="mx-auto w-full max-w-[868px] px-6 pb-7 pt-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-appDisplay text-[28px] font-medium leading-9 tracking-title text-gray-900 dark:text-gray-100">
              {greeting()}, {user?.name?.split(" ")[0] ?? "there"} <span aria-hidden>☀️</span>
            </h1>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 text-base text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <MessageSquare className="size-4" />
              Feedback
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="inline-flex items-center gap-1.5 text-base font-medium text-gray-600 dark:text-gray-400">
              <Sparkles className="size-4 text-purple-500" />
              Personal Assistant
              <Info className="size-3.5 text-gray-400" />
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 text-base text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <Settings2 className="size-4" />
              Manage
            </Link>
          </div>

          {/* The two assistants ship disabled, so their titles read dimmed and
              the only live affordance is the Enable link — as in the product. */}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {ASSISTANTS.map((assistant) => (
              <div
                key={assistant.key}
                className="rounded-lg border border-white/70 bg-white/55 p-4 shadow-e1 backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
              >
                <span className={cn("flex size-9 items-center justify-center rounded-lg text-white", assistant.tint)}>
                  {assistant.icon}
                </span>
                <p className="mt-4 text-md text-gray-400 dark:text-gray-500">
                  {assistant.name} <span className="text-base">(OFF)</span>
                </p>
                <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
                  <button
                    type="button"
                    onClick={() => toast.info(`${assistant.name} isn't part of this build`, "It needs calendar and email access.")}
                    className="font-medium text-purple-600 hover:underline dark:text-purple-400"
                  >
                    Enable
                  </button>{" "}
                  to view it.
                </p>
              </div>
            ))}

            <Link
              href="/tasks"
              className="rounded-lg border border-white/70 bg-white/55 p-4 shadow-e1 backdrop-blur-sm transition-shadow hover:shadow-e2 dark:border-white/10 dark:bg-white/5"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-lime-300 to-green-500 text-white">
                <SquareCheckBig className="size-4" />
              </span>
              <p className="mt-4 text-md text-gray-900 dark:text-gray-100">Tasks</p>
              <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
                {tasksQuery.isLoading ? "Loading…" : `${openTasks.length} New task${openTasks.length === 1 ? "" : "s"}`}
              </p>
            </Link>
          </div>

          <Link
            href="/integrations"
            className="mt-7 flex items-center gap-3 rounded-lg bg-purple-50/80 px-4 py-3.5 backdrop-blur-sm transition-colors hover:bg-purple-100/70 dark:bg-purple-500/10 dark:hover:bg-purple-500/15"
          >
            <span className="flex shrink-0 -space-x-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-white shadow-e1 ring-1 ring-black/5">
                <SlackMark />
              </span>
              <span className="flex size-7 items-center justify-center rounded-md bg-white shadow-e1 ring-1 ring-black/5">
                <GmailMark />
              </span>
            </span>
            <p className="min-w-0 flex-1 text-base text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">Connect Slack and Email</span> — get
              richer insights with full context.
            </p>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-base font-medium text-purple-700 dark:text-purple-300">
              Connect
              <ArrowRight className="size-4" />
            </span>
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[868px] px-6 pb-10 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg bg-gray-50 p-1 dark:bg-white/5">
            {(
              [
                { key: "recent", label: "Recent" },
                { key: "upcoming", label: `Upcoming · ${Math.min(openTasks.length, 9)}` },
                { key: "feed", label: "AI Feed" },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setTab(option.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-base font-medium transition-colors",
                  tab === option.key
                    ? "bg-white text-gray-900 shadow-e1 ring-1 ring-gray-200 dark:bg-ink-500 dark:text-gray-100 dark:ring-white/10"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-base text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <Settings2 className="size-4" />
            Settings
          </Link>
        </div>

        <div className="mt-4">
          {tab === "recent" &&
            (meetingsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : meetings.length === 0 ? (
              <p className="py-10 text-center text-base text-gray-500">No meetings yet.</p>
            ) : (
              <ul className="space-y-1">
                {meetings.map((meeting) => (
                  <li key={meeting.id}>
                    <Link
                      href={`/view/${meeting.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <Avatar
                        name={meeting.participants[0]?.name ?? meeting.title}
                        color={meeting.participants[0]?.color}
                        size="lg"
                        className="rounded-full"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-md font-medium text-gray-900 dark:text-gray-100">
                          {meeting.title}
                        </span>
                        <span className="block text-base text-gray-500 dark:text-gray-400">
                          {formatMeetingDate(meeting.meeting_date)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "upcoming" &&
            (openTasks.length === 0 ? (
              <p className="py-10 text-center text-base text-gray-500">Nothing outstanding.</p>
            ) : (
              <ul className="space-y-1">
                {openTasks.slice(0, 8).map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/view/${task.meeting_id}`}
                      className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gray-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-base leading-6 text-gray-800 dark:text-gray-200">{task.text}</span>
                        <span className="block text-sm text-gray-500">
                          {task.assignee_name ?? "Unassigned"} · {task.meeting_title}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "feed" && (
            <p className="py-10 text-center text-base text-gray-500 dark:text-gray-400">
              The AI feed summarises activity across a whole workspace — that needs the team features this build
              leaves as placeholders.
            </p>
          )}

          <p className="mt-6 text-center">
            <span className="rounded-full bg-purple-50 px-3 py-1 text-base text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
              All caught up!
            </span>
          </p>
        </div>
      </div>

      <CreateMeetingModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </AppShell>
  );
}
