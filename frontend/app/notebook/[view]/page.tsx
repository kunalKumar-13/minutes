"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown, Bot, CalendarDays, FileText, Plus, Search, SlidersHorizontal,
  Star, Tag as TagIcon, Trash2, Users, X,
} from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import type { Meeting, MeetingFilters } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDebounced } from "@/lib/useDebounced";
import { AppShell } from "@/components/layout/AppShell";
import { ChannelSidebar } from "@/components/layout/ChannelSidebar";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Modal";
import { MeetingRowSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { CreateMeetingModal } from "@/components/meetings/CreateMeetingModal";
import { EditMeetingModal } from "@/components/meetings/EditMeetingModal";
import { MeetingRow } from "@/components/meetings/MeetingRow";

/** The four library views, keyed by the URL segment the real app uses. */
const VIEWS = {
  "mine-shared": { title: "My Meetings", favorite: undefined },
  all: { title: "All Meetings", favorite: undefined },
  favorites: { title: "Favourites", favorite: true },
  autopilot: { title: "Voice Agent Meetings", favorite: undefined },
} as const;

type ViewKey = keyof typeof VIEWS;

const SORTS: { key: NonNullable<MeetingFilters["sort"]>; label: string }[] = [
  { key: "recent", label: "Most recent" },
  { key: "oldest", label: "Oldest first" },
  { key: "title", label: "Title A–Z" },
  { key: "duration", label: "Longest first" },
];

const DATE_RANGES = [
  { key: "any", label: "Any time", days: null },
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
] as const;

const PAGE_SIZE = 20;

export default function NotebookView() {
  const params = useParams<{ view: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const queryClient = useQueryClient();

  const view = (params.view in VIEWS ? params.view : "mine-shared") as ViewKey;
  const config = VIEWS[view];

  const [hostedByMe, setHostedByMe] = useState(true);
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebounced(rawQuery, 280);
  const [sort, setSort] = useState<NonNullable<MeetingFilters["sort"]>>("recent");
  const [range, setRange] = useState<(typeof DATE_RANGES)[number]["key"]>("any");
  const [participant, setParticipant] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [deleting, setDeleting] = useState<Meeting | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);

  // A channel chosen in the sidebar arrives as ?tag=, so the sidebar and the
  // filter bar drive the same query rather than competing pieces of state.
  const tag = searchParams.get("tag");

  const filters = useMemo<MeetingFilters>(() => {
    const days = DATE_RANGES.find((option) => option.key === range)?.days ?? null;
    return {
      q: query || undefined,
      participant: participant ?? undefined,
      tag: tag ?? undefined,
      favorite: config.favorite,
      date_from: days ? new Date(Date.now() - days * 86_400_000).toISOString() : undefined,
      sort,
      page,
      page_size: PAGE_SIZE,
    };
  }, [query, participant, tag, config.favorite, range, sort, page]);

  const meetingsQuery = useQuery({
    queryKey: queryKeys.meetings(filters),
    queryFn: () => api.meetings(filters),
    enabled: view !== "autopilot",
  });
  const tagsQuery = useQuery({ queryKey: queryKeys.tags, queryFn: api.tags });

  const items = useMemo(() => meetingsQuery.data?.items ?? [], [meetingsQuery.data]);
  const total = meetingsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const knownParticipants = useMemo(() => {
    const names = new Set<string>();
    items.forEach((meeting) => meeting.participants.forEach((person) => names.add(person.name)));
    return [...names].sort();
  }, [items]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["meetings"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };

  const favoriteMutation = useMutation({
    mutationFn: (meeting: Meeting) => api.toggleFavorite(meeting.id),
    onSuccess: (updated) => {
      invalidate();
      toast.success(updated.is_favorite ? "Added to favourites" : "Removed from favourites");
    },
    onError: () => toast.error("Could not update this meeting"),
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api.deleteMeeting(id))),
    onSuccess: (_result, ids) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setSelected(new Set());
      setDeleting(null);
      setBulkDelete(false);
      toast.success(ids.length === 1 ? "Meeting deleted" : `${ids.length} meetings deleted`);
    },
    onError: () => toast.error("Could not delete"),
  });

  const allOnPageSelected = items.length > 0 && items.every((meeting) => selected.has(meeting.id));
  const activeFilterCount = [participant, tag, range !== "any" ? range : null].filter(Boolean).length;

  const resetFilters = () => {
    setParticipant(null);
    setRange("any");
    setPage(1);
    if (tag) router.push(`/notebook/${view}`);
  };

  return (
    <AppShell
      title={config.title}
      sidebar={<ChannelSidebar tags={tagsQuery.data} />}
      onCapture={() => setCreateOpen(true)}
    >
      <div className="flex h-full flex-col">
        {/* Filter bar, matching the app's pill row over the list. */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--app-border)] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHostedByMe((value) => !value)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-base font-medium transition-colors",
                hostedByMe
                  ? "border-gray-200 bg-white text-purple-700 shadow-e1 dark:border-white/15 dark:bg-ink-500 dark:text-purple-300"
                  : "border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5",
              )}
            >
              Hosted by me
              {hostedByMe && <X className="size-3.5" />}
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-transparent px-2.5 text-base font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
              onClick={() => toast.info("Shared meetings need team workspaces", "That's a placeholder in this build.")}
            >
              Shared with me
            </button>
          </div>

          <span className="mx-1 h-5 w-px bg-[var(--app-border)]" />

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-base font-medium transition-colors",
              showFilters || activeFilterCount
                ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-300"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:bg-ink-500 dark:text-gray-200",
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-purple-600 px-1.5 text-2xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {tag && (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-purple-50 px-2.5 text-base font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
              #{tag}
              <button type="button" aria-label="Clear channel" onClick={() => router.push(`/notebook/${view}`)}>
                <X className="size-3.5" />
              </button>
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <SearchInput
              value={rawQuery}
              onValueChange={(value) => {
                setRawQuery(value);
                setPage(1);
              }}
              placeholder="Search this list"
              containerClassName="w-[220px]"
              className="h-8"
            />
            <Dropdown
              align="end"
              trigger={
                <button
                  type="button"
                  aria-label="Sort meetings"
                  className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/15 dark:bg-ink-500 dark:text-gray-300"
                >
                  <ArrowUpDown className="size-4" />
                </button>
              }
              items={SORTS.map((option) => ({
                key: option.key,
                label: option.label,
                selected: sort === option.key,
                onSelect: () => setSort(option.key),
              }))}
            />
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--app-border)] bg-gray-25 px-4 py-2.5 dark:bg-white/[0.02]">
            <Dropdown
              trigger={
                <span className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-base text-gray-700 dark:border-white/15 dark:bg-ink-500 dark:text-gray-200">
                  <CalendarDays className="size-3.5 text-gray-400" />
                  {DATE_RANGES.find((o) => o.key === range)?.label}
                </span>
              }
              items={DATE_RANGES.map((option) => ({
                key: option.key,
                label: option.label,
                selected: range === option.key,
                onSelect: () => {
                  setRange(option.key);
                  setPage(1);
                },
              }))}
            />
            <Dropdown
              trigger={
                <span className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-base text-gray-700 dark:border-white/15 dark:bg-ink-500 dark:text-gray-200">
                  <Users className="size-3.5 text-gray-400" />
                  {participant ?? "Anyone"}
                </span>
              }
              items={[
                { key: "any", label: "Anyone", selected: !participant, onSelect: () => setParticipant(null) },
                ...knownParticipants.map((name) => ({
                  key: name,
                  label: name,
                  selected: participant === name,
                  onSelect: () => {
                    setParticipant(name);
                    setPage(1);
                  },
                })),
              ]}
            />
            <Dropdown
              trigger={
                <span className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-base text-gray-700 dark:border-white/15 dark:bg-ink-500 dark:text-gray-200">
                  <TagIcon className="size-3.5 text-gray-400" />
                  {tag ?? "All channels"}
                </span>
              }
              items={[
                { key: "any", label: "All channels", selected: !tag, onSelect: () => router.push(`/notebook/${view}`) },
                ...(tagsQuery.data ?? []).map((item) => ({
                  key: item.id,
                  label: `${item.name} (${item.meeting_count})`,
                  selected: tag === item.name,
                  onSelect: () => router.push(`/notebook/${view}?tag=${encodeURIComponent(item.name)}`),
                })),
              ]}
            />
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            )}
            <span className="ml-auto text-base text-gray-500 dark:text-gray-400">
              {total} meeting{total === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {selected.size > 0 && (
          <div className="flex items-center gap-3 border-b border-[var(--app-border)] bg-purple-25 px-4 py-2 dark:bg-purple-500/5">
            <span className="text-base font-medium text-gray-900 dark:text-gray-100">{selected.size} selected</span>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setBulkDelete(true)}
            >
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        )}

        <div className="ff-scroll min-h-0 flex-1 overflow-y-auto">
          {view === "autopilot" ? (
            <EmptyState
              icon={<Bot className="size-5" />}
              title="No voice agent meetings"
              description="A voice agent that dials into calls on your behalf needs live capture, which isn't part of this build."
            />
          ) : meetingsQuery.isLoading ? (
            <>
              <MeetingRowSkeleton />
              <MeetingRowSkeleton />
              <MeetingRowSkeleton />
              <MeetingRowSkeleton />
            </>
          ) : meetingsQuery.isError ? (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="Couldn't load your meetings"
              description={(meetingsQuery.error as Error).message}
              action={<Button onClick={() => meetingsQuery.refetch()}>Try again</Button>}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={view === "favorites" ? <Star className="size-5" /> : <Search className="size-5" />}
              title={
                query || activeFilterCount
                  ? "No meetings match those filters"
                  : view === "favorites"
                    ? "No favourites yet"
                    : "Looks like you haven't recorded a meeting yet"
              }
              description={
                query || activeFilterCount
                  ? "Try a different search, or clear the filters."
                  : view === "favorites"
                    ? "Star a meeting to keep it here."
                    : "Capture a meeting by pasting or uploading a transcript, and it'll show up right here."
              }
              action={
                query || activeFilterCount ? (
                  <Button
                    onClick={() => {
                      setRawQuery("");
                      resetFilters();
                    }}
                  >
                    Clear everything
                  </Button>
                ) : (
                  <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
                    Capture
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-[var(--app-border)] bg-gray-25 px-4 py-2 dark:bg-white/[0.02]">
                <input
                  type="checkbox"
                  aria-label="Select all meetings on this page"
                  checked={allOnPageSelected}
                  onChange={(event) =>
                    setSelected(event.target.checked ? new Set(items.map((meeting) => meeting.id)) : new Set())
                  }
                  className="size-4 cursor-pointer rounded border-gray-200 text-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-white/20 dark:bg-ink-500"
                />
                <span className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Meeting
                </span>
              </div>

              {items.map((meeting) => (
                <MeetingRow
                  key={meeting.id}
                  meeting={meeting}
                  query={query}
                  selected={selected.has(meeting.id)}
                  onSelectedChange={(isSelected) =>
                    setSelected((current) => {
                      const next = new Set(current);
                      if (isSelected) next.add(meeting.id);
                      else next.delete(meeting.id);
                      return next;
                    })
                  }
                  onToggleFavorite={(target) => favoriteMutation.mutate(target)}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="text-base text-gray-500 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                      Previous
                    </Button>
                    <Button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CreateMeetingModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditMeetingModal meeting={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate([deleting.id])}
        loading={deleteMutation.isPending}
        destructive
        title="Delete this meeting?"
        confirmLabel="Delete meeting"
        message={`“${deleting?.title}” and its transcript, notes and action items will be permanently removed. This can't be undone.`}
      />

      <ConfirmDialog
        open={bulkDelete}
        onClose={() => setBulkDelete(false)}
        onConfirm={() => deleteMutation.mutate([...selected])}
        loading={deleteMutation.isPending}
        destructive
        title={`Delete ${selected.size} meetings?`}
        confirmLabel={`Delete ${selected.size} meetings`}
        message="Their transcripts, notes and action items will be permanently removed. This can't be undone."
      />
    </AppShell>
  );
}
