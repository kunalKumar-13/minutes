"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, MessageSquareQuote, Search as SearchIcon, SquareCheckBig } from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import { cn, formatMeetingDate, formatTimestamp, highlightParts } from "@/lib/utils";
import { useDebounced } from "@/lib/useDebounced";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

type Facet = "all" | "meetings" | "transcript" | "tasks";

function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark key={index} className="ff-mark">
            {part.value}
          </mark>
        ) : (
          <span key={index}>{part.value}</span>
        ),
      )}
    </>
  );
}

export default function SearchPage() {
  const [raw, setRaw] = useState("");
  const [facet, setFacet] = useState<Facet>("all");
  const query = useDebounced(raw, 300);

  const searchQuery = useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => api.search(query),
    enabled: query.trim().length > 1,
  });

  const result = searchQuery.data;
  const show = (which: Facet) => facet === "all" || facet === which;

  const facets: { key: Facet; label: string; count: number }[] = [
    { key: "all", label: "Everything", count: result?.total ?? 0 },
    { key: "meetings", label: "Meetings", count: result?.meetings.length ?? 0 },
    { key: "transcript", label: "Transcript lines", count: result?.segments.length ?? 0 },
    { key: "tasks", label: "Action items", count: result?.action_items.length ?? 0 },
  ];

  return (
    <AppShell title="Search">
      <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-6">
        <h1 className="font-display text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
          Search
        </h1>
        <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
          One query across every transcript, meeting title and action item.
        </p>

        <SearchInput
          value={raw}
          onValueChange={setRaw}
          autoFocus
          placeholder="Try “retention”, “renewal”, or a person's name"
          containerClassName="mt-5"
          className="h-11 text-md"
        />

        {query.trim().length > 1 && result && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {facets.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setFacet(option.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-base font-medium transition-colors",
                  facet === option.key
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10",
                )}
              >
                {option.label} · {option.count}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-8">
          {query.trim().length <= 1 ? (
            <EmptyState
              icon={<SearchIcon className="size-5" />}
              title="Search your workspace"
              description="Type at least two characters. Results are ranked by full-text relevance across every meeting."
            />
          ) : searchQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !result || result.total === 0 ? (
            <EmptyState
              icon={<SearchIcon className="size-5" />}
              title={`Nothing matches “${query}”`}
              description="Try a shorter phrase, or a single distinctive word."
            />
          ) : (
            <>
              {show("meetings") && result.meetings.length > 0 && (
                <section>
                  <h2 className="mb-2 text-base font-semibold uppercase tracking-wide text-gray-500">Meetings</h2>
                  <div className="ff-surface divide-y divide-[var(--app-border)] overflow-hidden rounded-xl border">
                    {result.meetings.map((meeting) => (
                      <Link
                        key={meeting.id}
                        href={`/view/${meeting.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <FileText className="size-4 shrink-0 text-gray-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-md font-medium text-gray-900 dark:text-gray-100">
                            <Marked text={meeting.title} query={query} />
                          </p>
                          <p className="truncate text-base text-gray-500 dark:text-gray-400">
                            {formatMeetingDate(meeting.meeting_date)} · {meeting.participants.length} participants
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {show("transcript") && result.segments.length > 0 && (
                <section>
                  <h2 className="mb-2 text-base font-semibold uppercase tracking-wide text-gray-500">
                    Transcript lines
                  </h2>
                  <div className="ff-surface divide-y divide-[var(--app-border)] overflow-hidden rounded-xl border">
                    {result.segments.map((match) => (
                      <Link
                        key={match.segment_id}
                        href={`/view/${match.meeting_id}`}
                        className="block px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={match.speaker_name} size="sm" />
                          <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                            {match.speaker_name}
                          </span>
                          <span className="text-sm tabular-nums text-blue-700 dark:text-blue-400">
                            {formatTimestamp(match.start_ms)}
                          </span>
                          <span className="ml-auto truncate text-sm text-gray-400">{match.meeting_title}</span>
                        </div>
                        <p className="mt-1.5 pl-8 text-base leading-6 text-gray-700 dark:text-gray-300">
                          <Marked text={match.snippet} query={query} />
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {show("tasks") && result.action_items.length > 0 && (
                <section>
                  <h2 className="mb-2 text-base font-semibold uppercase tracking-wide text-gray-500">Action items</h2>
                  <div className="ff-surface divide-y divide-[var(--app-border)] overflow-hidden rounded-xl border">
                    {result.action_items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/view/${item.meeting_id}`}
                        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <SquareCheckBig
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            item.status === "completed" ? "text-green-600" : "text-gray-400",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-base leading-6",
                              item.status === "completed"
                                ? "text-gray-400 line-through"
                                : "text-gray-700 dark:text-gray-300",
                            )}
                          >
                            <Marked text={item.text} query={query} />
                          </p>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {item.assignee_name ?? "Unassigned"} · {item.meeting_title}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {facet !== "all" && facets.find((f) => f.key === facet)?.count === 0 && (
                <EmptyState
                  icon={<MessageSquareQuote className="size-5" />}
                  title="Nothing in this category"
                  description="Switch back to Everything to see the other matches."
                />
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
