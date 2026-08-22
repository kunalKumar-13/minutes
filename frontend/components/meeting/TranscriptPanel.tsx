"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check, ChevronDown, ChevronUp, Copy, MessageSquarePlus, Pencil, Scissors, X,
} from "lucide-react";
import type { Comment, Participant, Segment } from "@/lib/types";
import { cn, escapeRegExp, formatTimestamp } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { SearchInput, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface TranscriptPanelProps {
  segments: Segment[];
  participants: Participant[];
  comments: Comment[];
  currentMs: number;
  playing: boolean;
  onSeek: (ms: number) => void;
  onEditSegment: (segmentId: string, text: string) => Promise<unknown> | void;
  onReassignSpeaker: (segmentId: string, participantId: string) => Promise<unknown> | void;
  onCommentOn: (segment: Segment) => void;
  onSoundbiteFrom: (segment: Segment) => void;
  onCopied: () => void;
  /** Hidden when the panel already sits under a tab strip. */
  showHeader?: boolean;
  searchPlaceholder?: string;
}

/** Marks every occurrence of `query`, flagging the currently-focused match. */
function HighlightedText({
  text, query, activeOffset,
}: {
  text: string;
  query: string;
  activeOffset: number | null;
}) {
  const terms = query.trim().split(/\s+/).filter((term) => term.length > 1);
  if (terms.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let occurrence = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));
    const isActive = occurrence === activeOffset;
    nodes.push(
      <mark key={`${index}-${occurrence}`} className="ff-mark" data-active={isActive}>
        {match[0]}
      </mark>,
    );
    lastIndex = index + match[0].length;
    occurrence += 1;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return <>{nodes}</>;
}

export function TranscriptPanel({
  segments, participants, comments, currentMs, playing, onSeek,
  onEditSegment, onReassignSpeaker, onCommentOn, onSoundbiteFrom, onCopied,
  showHeader = true, searchPlaceholder = "Search this transcript",
}: TranscriptPanelProps) {
  const [query, setQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [follow, setFollow] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  // Set while we scroll programmatically, so the follow toggle isn't switched
  // off by the scroll event our own auto-scroll just fired.
  const autoScrolling = useRef(false);

  const commentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    comments.forEach((comment) => {
      if (!comment.segment_id) return;
      counts.set(comment.segment_id, (counts.get(comment.segment_id) ?? 0) + 1);
    });
    return counts;
  }, [comments]);

  /** Flat list of every match, so ↑/↓ can walk them across segments. */
  const matches = useMemo(() => {
    const terms = query.trim().split(/\s+/).filter((term) => term.length > 1);
    if (terms.length === 0) return [] as { segmentId: string; offset: number }[];
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
    const found: { segmentId: string; offset: number }[] = [];
    segments.forEach((segment) => {
      let offset = 0;
      // Count occurrences per segment so each match gets a stable index.
      const count = segment.text.match(pattern)?.length ?? 0;
      for (offset = 0; offset < count; offset += 1) {
        found.push({ segmentId: segment.id, offset });
      }
    });
    return found;
  }, [query, segments]);

  useEffect(() => setMatchIndex(0), [query]);

  const activeMatch = matches[matchIndex];

  /** The line being spoken right now — drives the follow highlight. */
  const activeSegmentId = useMemo(() => {
    if (segments.length === 0) return null;
    let candidate: Segment | null = null;
    for (const segment of segments) {
      if (segment.start_ms <= currentMs) candidate = segment;
      else break;
    }
    return (candidate ?? segments[0]).id;
  }, [segments, currentMs]);

  // Scroll the current line into view while playing, unless the user has
  // scrolled away.
  useEffect(() => {
    if (!follow || !playing || !activeRef.current) return;
    autoScrolling.current = true;
    activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = window.setTimeout(() => {
      autoScrolling.current = false;
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activeSegmentId, follow, playing]);

  // Bring the focused search match into view.
  useEffect(() => {
    if (!activeMatch) return;
    const element = listRef.current?.querySelector<HTMLElement>(`[data-segment="${activeMatch.segmentId}"]`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeMatch]);

  const stepMatch = useCallback(
    (delta: number) => {
      if (matches.length === 0) return;
      setMatchIndex((current) => (current + delta + matches.length) % matches.length);
    },
    [matches.length],
  );

  const startEditing = (segment: Segment) => {
    setEditingId(segment.id);
    setDraft(segment.text);
  };

  const commitEdit = async () => {
    if (!editingId) return;
    await onEditSegment(editingId, draft.trim());
    setEditingId(null);
  };

  return (
    <section aria-label="Transcript" className="flex h-full min-h-0 flex-col">
      {showHeader && (
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--app-border)] px-4 py-3">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Transcript</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{segments.length} lines</span>
          <button
            type="button"
            onClick={() => setFollow((value) => !value)}
            aria-pressed={follow}
            className={cn(
              "rounded-full px-2 py-0.5 text-2xs font-medium transition-colors",
              follow
                ? "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
            )}
          >
            Auto-scroll {follow ? "on" : "off"}
          </button>
        </div>
      </header>
      )}

      <div className="shrink-0 px-4 pb-3 pt-3">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder={searchPlaceholder}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            stepMatch(event.shiftKey ? -1 : 1);
          }}
        />
        {query.trim().length > 1 && (
          <div className="mt-2 flex items-center justify-between px-0.5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {matches.length === 0
                ? "No matches"
                : `${matchIndex + 1} of ${matches.length} match${matches.length === 1 ? "" : "es"}`}
            </span>
            <div className="flex items-center gap-0.5">
              <IconButton label="Previous match" size="sm" disabled={matches.length === 0} onClick={() => stepMatch(-1)}>
                <ChevronUp className="size-4" />
              </IconButton>
              <IconButton label="Next match" size="sm" disabled={matches.length === 0} onClick={() => stepMatch(1)}>
                <ChevronDown className="size-4" />
              </IconButton>
              <IconButton label="Clear search" size="sm" onClick={() => setQuery("")}>
                <X className="size-4" />
              </IconButton>
            </div>
          </div>
        )}
      </div>

      <div
        ref={listRef}
        className="ff-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-8"
        onScroll={() => {
          if (!autoScrolling.current && follow && playing) setFollow(false);
        }}
      >
        {segments.length === 0 ? (
          <p className="px-1 py-10 text-center text-base text-gray-500 dark:text-gray-400">
            This meeting has no transcript yet.
          </p>
        ) : (
          segments.map((segment) => {
            const speaker = participants.find((person) => person.id === segment.speaker_id);
            const isActive = segment.id === activeSegmentId;
            const isEditing = segment.id === editingId;
            const commentCount = commentCounts.get(segment.id) ?? 0;

            return (
              <div
                key={segment.id}
                data-segment={segment.id}
                ref={isActive ? activeRef : undefined}
                className={cn(
                  "group -mx-2 rounded-lg px-2 py-2.5 transition-colors",
                  isActive
                    ? "bg-purple-25 ring-1 ring-inset ring-purple-100 dark:bg-purple-500/10 dark:ring-purple-500/20"
                    : "hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                )}
              >
                <div className="flex items-center gap-2">
                  <Avatar name={segment.speaker_name} color={speaker?.color} size="md" />

                  <Dropdown
                    align="start"
                    trigger={
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded text-md font-medium text-gray-900 transition-colors hover:text-purple-700 dark:text-gray-100 dark:hover:text-purple-300"
                      >
                        {segment.speaker_name}
                        <ChevronDown className="size-3.5 text-gray-400" />
                      </button>
                    }
                    items={[
                      { key: "header", label: <span className="text-gray-500">Reassign this line to…</span>, disabled: true },
                      ...participants.map((person) => ({
                        key: person.id,
                        label: person.name,
                        selected: person.id === segment.speaker_id,
                        onSelect: () => onReassignSpeaker(segment.id, person.id),
                      })),
                    ]}
                  />

                  <span className="text-gray-300 dark:text-gray-600">·</span>

                  <button
                    type="button"
                    onClick={() => onSeek(segment.start_ms)}
                    className="rounded text-base font-medium tabular-nums text-blue-700 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-blue-500 dark:text-blue-400 dark:decoration-blue-700"
                    title={`Jump to ${formatTimestamp(segment.start_ms)}`}
                  >
                    {formatTimestamp(segment.start_ms)}
                  </button>

                  <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <IconButton
                      label="Copy this line"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`[${formatTimestamp(segment.start_ms)}] ${segment.speaker_name}: ${segment.text}`);
                        onCopied();
                      }}
                    >
                      <Copy className="size-3.5" />
                    </IconButton>
                    <IconButton label="Edit this line" size="sm" onClick={() => startEditing(segment)}>
                      <Pencil className="size-3.5" />
                    </IconButton>
                    <IconButton label="Comment on this line" size="sm" onClick={() => onCommentOn(segment)}>
                      <MessageSquarePlus className="size-3.5" />
                    </IconButton>
                    <IconButton label="Clip a soundbite from here" size="sm" onClick={() => onSoundbiteFrom(segment)}>
                      <Scissors className="size-3.5" />
                    </IconButton>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={draft}
                      rows={3}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") setEditingId(null);
                        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) commitEdit();
                      }}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="primary" icon={<Check className="size-3.5" />} onClick={commitEdit}>
                        Save
                      </Button>
                      <Button size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <span className="text-xs text-gray-400">⌘↵ to save · Esc to cancel</span>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => onSeek(segment.start_ms)}
                    className="mt-1 cursor-pointer pl-9 text-prose text-gray-700 dark:text-gray-300"
                  >
                    <HighlightedText
                      text={segment.text}
                      query={query}
                      activeOffset={activeMatch?.segmentId === segment.id ? activeMatch.offset : null}
                    />
                  </p>
                )}

                {commentCount > 0 && (
                  <p className="mt-1.5 pl-9 text-sm text-gray-400">
                    {commentCount} comment{commentCount === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
