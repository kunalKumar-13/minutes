"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, SquareCheckBig, Trash2 } from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import type { ActionItemWithMeeting } from "@/lib/types";
import { cn, formatMeetingDate, formatTimestamp } from "@/lib/utils";
import { useDebounced } from "@/lib/useDebounced";
import { AppShell } from "@/components/layout/AppShell";
import { ChannelSidebar } from "@/components/layout/ChannelSidebar";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Filter = "open" | "completed" | "all";

export default function TasksPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("open");
  const [raw, setRaw] = useState("");
  const query = useDebounced(raw, 280);

  const params = useMemo(
    () => ({ status: filter === "all" ? undefined : filter, q: query || undefined }),
    [filter, query],
  );

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => api.tasks(params),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["meetings"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };

  const toggle = useMutation({
    mutationFn: (item: ActionItemWithMeeting) =>
      api.updateActionItem(item.id, { status: item.status === "completed" ? "open" : "completed" }),
    onSuccess: refresh,
    onError: () => toast.error("Could not update that action item"),
  });

  const remove = useMutation({
    mutationFn: (item: ActionItemWithMeeting) => api.deleteActionItem(item.id),
    onSuccess: () => {
      refresh();
      toast.success("Action item deleted");
    },
    onError: () => toast.error("Could not delete that action item"),
  });

  const items = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  /** Group by assignee so the page answers "what do I owe" at a glance. */
  const grouped = useMemo(() => {
    const groups = new Map<string, ActionItemWithMeeting[]>();
    items.forEach((item) => {
      const key = item.assignee_name ?? "Unassigned";
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [items]);

  return (
    <AppShell title="Tasks" sidebar={<ChannelSidebar />}>
      <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-6">
        <h1 className="font-display text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">Tasks</h1>
        <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
          Every action item extracted from your meetings, grouped by who owns it.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <SearchInput
            value={raw}
            onValueChange={setRaw}
            placeholder="Search action items"
            containerClassName="min-w-[220px] flex-1"
          />
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/5">
            {(["open", "completed", "all"] as Filter[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-base font-medium capitalize transition-colors",
                  filter === option
                    ? "bg-white text-gray-900 shadow-e1 dark:bg-ink-500 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          {tasksQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              className="ff-surface rounded-xl border"
              icon={<SquareCheckBig className="size-5" />}
              title={query ? "No matching action items" : filter === "open" ? "Nothing outstanding" : "No action items"}
              description={
                query
                  ? "Try a different search term."
                  : filter === "open"
                    ? "Every action item in the workspace is done."
                    : "Action items appear here as meetings are transcribed."
              }
            />
          ) : (
            <div className="space-y-6">
              {grouped.map(([assignee, group]) => (
                <section key={assignee}>
                  <div className="mb-2 flex items-center gap-2">
                    {assignee !== "Unassigned" && <Avatar name={assignee} size="md" />}
                    <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100">{assignee}</h2>
                    <span className="text-base text-gray-400">{group.length}</span>
                  </div>

                  <ul className="ff-surface divide-y divide-[var(--app-border)] overflow-hidden rounded-xl border">
                    {group.map((item) => {
                      const done = item.status === "completed";
                      return (
                        <li key={item.id} className="group flex items-start gap-3 px-4 py-3">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={done}
                            aria-label={done ? `Reopen: ${item.text}` : `Complete: ${item.text}`}
                            onClick={() => toggle.mutate(item)}
                            className={cn(
                              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                              done
                                ? "border-purple-600 bg-purple-600 text-white"
                                : "border-gray-200 hover:border-purple-500 dark:border-white/25",
                            )}
                          >
                            {done && <Check className="size-3" strokeWidth={3} />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-base leading-6",
                                done ? "text-gray-400 line-through" : "text-gray-800 dark:text-gray-200",
                              )}
                            >
                              {item.text}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                              <Link
                                href={`/view/${item.meeting_id}`}
                                className="truncate font-medium text-purple-600 hover:underline dark:text-purple-400"
                              >
                                {item.meeting_title}
                              </Link>
                              <span>{formatMeetingDate(item.meeting_date, false)}</span>
                              {item.timestamp_ms !== null && (
                                <span className="tabular-nums">at {formatTimestamp(item.timestamp_ms)}</span>
                              )}
                              {item.due_date && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="size-3" />
                                  Due {formatMeetingDate(item.due_date, false)}
                                </span>
                              )}
                              {item.priority === "high" && (
                                <span className="font-medium text-red-600 dark:text-red-400">High priority</span>
                              )}
                            </div>
                          </div>

                          <IconButton
                            label="Delete action item"
                            size="sm"
                            className="opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                            onClick={() => remove.mutate(item)}
                          >
                            <Trash2 className="size-3.5" />
                          </IconButton>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
