"use client";

import { useState } from "react";
import { ChevronUp, Hash, Plus, Search } from "lucide-react";
import type { InsightFilter, MeetingInsights } from "@/lib/types";
import { cn, formatTimestamp } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";

const DOT: Record<string, string> = {
  green: "bg-green-400", cyan: "bg-cyan-400", orange: "bg-orange-400",
  pink: "bg-pink-400", purple: "bg-purple-400", blue: "bg-blue-400",
};

const SENTIMENT_DOT: Record<string, string> = {
  neutral: "bg-pink-300", positive: "bg-cyan-400", negative: "bg-orange-400",
};

function Section({
  title, action, children, defaultOpen = true,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-[var(--app-border)] px-4 py-3.5">
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-xs font-medium uppercase tracking-[0.04em] text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        {action}
        <button
          type="button"
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="rounded-sm p-0.5 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
        >
          <ChevronUp className={cn("size-4 transition-transform", !open && "rotate-180")} />
        </button>
      </div>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

/** A donut, drawn with one SVG circle and a dash offset. */
function Donut({ percent, className }: { percent: number; className?: string }) {
  const r = 8;
  const circumference = 2 * Math.PI * r;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="10" cy="10" r={r} fill="none" strokeWidth="4" className="stroke-gray-200 dark:stroke-white/10" />
      <circle
        cx="10" cy="10" r={r} fill="none" strokeWidth="4" strokeLinecap="round"
        className="stroke-purple-500"
        strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
        transform="rotate(-90 10 10)"
      />
    </svg>
  );
}

export interface SmartSearchPanelProps {
  insights?: MeetingInsights;
  loading: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  activeFilter: string | null;
  onFilterChange: (key: string | null) => void;
  onSeek: (ms: number) => void;
}

/**
 * The analysis column: search, entity filters, sentiment split, speaker talk
 * time and topic trackers. Every number here is derived from the stored
 * transcript on read, so selecting a filter lands on real lines.
 */
export function SmartSearchPanel({
  insights, loading, query, onQueryChange, activeFilter, onFilterChange, onSeek,
}: SmartSearchPanelProps) {
  const selected: InsightFilter | undefined = insights?.filters.find((f) => f.key === activeFilter);

  return (
    <aside className="hidden w-[340px] shrink-0 flex-col border-r border-[var(--app-border)] bg-[var(--app-surface)] xl:flex">
      <header className="shrink-0 border-b border-[var(--app-border)] px-4 py-3.5">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Smart Search</h2>
      </header>

      <div className="shrink-0 border-b border-[var(--app-border)] px-4 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search for keywords & topics."
            aria-label="Search this meeting"
            className="h-9 w-full rounded-sm border border-gray-200 bg-white pl-8 pr-2 text-base text-gray-700 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-white/10 dark:bg-ink-500 dark:text-gray-200 dark:focus:ring-purple-500/20 [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>
      </div>

      <div className="ff-scroll min-h-0 flex-1 overflow-y-auto">
        <Section title="AI Filters">
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-11" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(insights?.filters ?? []).map((filter) => {
                const active = activeFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onFilterChange(active ? null : filter.key)}
                    className={cn(
                      "flex h-11 items-center gap-2 rounded-sm border px-2.5 text-left transition-colors",
                      active
                        ? "border-purple-300 bg-purple-50 dark:border-purple-500/40 dark:bg-purple-500/10"
                        : "border-transparent bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10",
                    )}
                  >
                    <span className={cn("size-1.5 shrink-0 rounded-full", DOT[filter.color] ?? "bg-gray-400")} />
                    <span className="min-w-0 flex-1 truncate text-base text-gray-700 dark:text-gray-300">
                      {filter.label}
                    </span>
                    <span className="shrink-0 text-base tabular-nums text-gray-400">{filter.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {selected && (
            <div className="mt-3 space-y-1.5">
              {selected.hits.length === 0 ? (
                <p className="px-1 text-base text-gray-500">Nothing found for this filter.</p>
              ) : (
                selected.hits.slice(0, 25).map((hit, index) => (
                  <button
                    key={`${hit.segment_id}-${index}`}
                    type="button"
                    onClick={() => hit.start_ms !== null && onSeek(hit.start_ms)}
                    className="block w-full rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {hit.speaker_name}
                      </span>
                      {hit.start_ms !== null && (
                        <span className="text-sm tabular-nums text-blue-700 dark:text-blue-400">
                          {formatTimestamp(hit.start_ms)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm leading-5 text-gray-500">{hit.text}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </Section>

        <Section title="Sentiments">
          {loading ? (
            <Skeleton className="h-28" />
          ) : (
            <div className="space-y-1">
              {(insights?.sentiment ?? []).map((slice) => (
                <div
                  key={slice.label}
                  className="flex items-center gap-2.5 rounded-sm bg-gray-50 px-2.5 py-2.5 dark:bg-white/5"
                >
                  <span className={cn("size-1.5 shrink-0 rounded-full", SENTIMENT_DOT[slice.label])} />
                  <span className="flex-1 text-base capitalize text-gray-700 dark:text-gray-300">{slice.label}</span>
                  <span className="text-base tabular-nums text-gray-500 dark:text-gray-400">{slice.percent}%</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Speaker Talktime">
          {loading ? (
            <Skeleton className="h-24" />
          ) : (
            <>
              <div className="flex items-center gap-2 px-2.5 pb-1.5 text-xs uppercase tracking-[0.04em] text-gray-400">
                <span className="flex-1">Speakers</span>
                <span className="w-10 text-right">WPM</span>
                <span className="w-16 text-right">Talktime</span>
              </div>
              <div className="space-y-1">
                {(insights?.speakers ?? []).map((speaker) => (
                  <div
                    key={speaker.participant_id}
                    className="flex items-center gap-2.5 rounded-sm bg-gray-50 px-2.5 py-2 dark:bg-white/5"
                    title={`${speaker.words} words over ${formatTimestamp(speaker.talk_time_seconds * 1000)}`}
                  >
                    <Avatar name={speaker.name} color={speaker.color} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-base text-gray-700 dark:text-gray-300">
                      {speaker.name}
                    </span>
                    <span className="flex w-10 items-center justify-end gap-1 text-base tabular-nums text-gray-600 dark:text-gray-400">
                      <span className="size-1 rounded-full bg-red-400" />
                      {speaker.wpm}
                    </span>
                    <span className="flex w-16 items-center justify-end gap-1.5">
                      <Donut percent={speaker.talk_time_percent} />
                      <span className="text-base tabular-nums text-gray-600 dark:text-gray-400">
                        {Math.round(speaker.talk_time_percent)}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        <Section
          title="Topic Trackers"
          action={
            <button
              type="button"
              aria-label="Add topic tracker"
              title="Trackers come from the meeting's key topics"
              className="rounded-sm p-0.5 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
            >
              <Plus className="size-4" />
            </button>
          }
        >
          {(insights?.topic_trackers ?? []).length === 0 ? (
            <p className="py-3 text-center text-base text-gray-400">No topic tracker</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {(insights?.topic_trackers ?? []).map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => onQueryChange(topic)}
                  className="inline-flex items-center gap-1 rounded-sm bg-gray-50 px-2 py-1 text-base text-gray-700 transition-colors hover:bg-gray-100 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  <Hash className="size-3 text-gray-400" />
                  {topic}
                </button>
              ))}
            </div>
          )}
        </Section>

        {insights && (
          <p className="px-4 py-3 text-sm text-gray-400">
            {insights.word_count.toLocaleString()} words · {insights.segment_count} lines
          </p>
        )}
      </div>
    </aside>
  );
}
