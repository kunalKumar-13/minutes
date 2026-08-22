"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, Clock, Users, Video } from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import { AVATAR_CLASSES, cn, formatDuration } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

function StatCard({
  icon, label, value, sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="ff-surface rounded-xl border p-4">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <span className="flex size-7 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400">
          {icon}
        </span>
        <span className="text-base font-medium">{label}</span>
      </div>
      <p className="mt-3 font-display text-4xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-gray-100">
        {value}
      </p>
      {sub && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const analyticsQuery = useQuery({ queryKey: queryKeys.analytics, queryFn: api.analytics });
  const data = analyticsQuery.data;

  const maxDay = Math.max(1, ...(data?.meetings_by_day.map((day) => day.count) ?? [1]));
  const totalTasks = (data?.open_action_items ?? 0) + (data?.completed_action_items ?? 0);
  const completionRate = totalTasks ? Math.round(((data?.completed_action_items ?? 0) / totalTasks) * 100) : 0;

  return (
    <AppShell title="Analytics">
      <div className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6">
        <h1 className="font-display text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
          Analytics
        </h1>
        <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
          How much time this workspace spends in meetings, and what comes out of them.
        </p>

        {analyticsQuery.isLoading ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        ) : !data ? (
          <EmptyState
            className="ff-surface mt-6 rounded-xl border"
            icon={<BarChart3 className="size-5" />}
            title="No analytics yet"
            description="Add a meeting and the numbers will appear here."
          />
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Video className="size-4" />}
                label="Meetings"
                value={String(data.total_meetings)}
                sub={`${data.meetings_this_week} in the last 7 days`}
              />
              <StatCard
                icon={<Clock className="size-4" />}
                label="Time recorded"
                value={formatDuration(data.total_duration_seconds)}
                sub={`${formatDuration(data.average_duration_seconds)} average`}
              />
              <StatCard
                icon={<Users className="size-4" />}
                label="People"
                value={String(data.total_participants)}
                sub="Across every meeting"
              />
              <StatCard
                icon={<CheckCircle2 className="size-4" />}
                label="Action items"
                value={`${completionRate}%`}
                sub={`${data.completed_action_items} done · ${data.open_action_items} open`}
              />
            </div>

            <section className="ff-surface rounded-xl border p-5">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Meetings over the last 14 days</h2>
              <div className="mt-5 flex h-40 items-end gap-1.5">
                {data.meetings_by_day.map((day) => {
                  const date = new Date(`${day.date}T00:00:00`);
                  return (
                    <div key={day.date} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div className="flex w-full flex-1 items-end">
                        <div
                          style={{ height: `${(day.count / maxDay) * 100}%` }}
                          title={`${day.count} meeting${day.count === 1 ? "" : "s"} on ${date.toDateString()}`}
                          className={cn(
                            "w-full rounded-t transition-colors",
                            day.count > 0
                              ? "bg-purple-500 group-hover:bg-purple-600"
                              : "bg-gray-100 dark:bg-white/5",
                            day.count === 0 && "min-h-[3px]",
                          )}
                        />
                      </div>
                      <span className="text-2xs tabular-nums text-gray-400">
                        {date.toLocaleDateString(undefined, { day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="ff-surface rounded-xl border p-5">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Who talks the most</h2>
                {data.top_speakers.length === 0 ? (
                  <p className="mt-3 text-base text-gray-500">No speaker data yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.top_speakers.map((speaker) => (
                      <li key={speaker.name} className="flex items-center gap-3">
                        <Avatar name={speaker.name} color={speaker.color} size="md" />
                        <span className="w-32 shrink-0 truncate text-base text-gray-700 dark:text-gray-300">
                          {speaker.name}
                        </span>
                        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                          <div
                            style={{ width: `${speaker.percent}%` }}
                            className={cn("h-full rounded-full", AVATAR_CLASSES[speaker.color].split(" ")[0])}
                          />
                        </div>
                        <span className="w-24 shrink-0 text-right text-sm tabular-nums text-gray-500 dark:text-gray-400">
                          {speaker.percent}% · {formatDuration(speaker.seconds)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="ff-surface rounded-xl border p-5">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">What you talk about</h2>
                {data.top_keywords.length === 0 ? (
                  <p className="mt-3 text-base text-gray-500">No keywords yet.</p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {data.top_keywords.map((entry) => (
                      <span
                        key={entry.keyword}
                        style={{ fontSize: `${13 + Math.min(6, entry.count * 2)}px` }}
                        className="rounded-full bg-purple-50 px-3 py-1 font-medium text-purple-700 ring-1 ring-inset ring-purple-100 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/25"
                      >
                        {entry.keyword}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
