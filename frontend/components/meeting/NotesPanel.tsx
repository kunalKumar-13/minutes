"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown, Copy, Download, HelpCircle, MoreHorizontal, Plus, RefreshCw, Sparkles,
} from "lucide-react";
import type { ActionItem, MeetingDetail, Participant } from "@/lib/types";
import { api } from "@/lib/api";
import { cn, formatTimestamp } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { ActionItemsSection } from "./ActionItems";

const SENTIMENT_COLORS = { positive: "green", neutral: "gray", negative: "red" } as const;

/** Chapter titles are stored as "🚀 Title"; split the emoji back out to render it. */
function splitEmoji(title: string): { emoji: string | null; label: string } {
  const match = title.match(/^(\p{Extended_Pictographic}️?)\s*(.*)$/u);
  return match ? { emoji: match[1], label: match[2] } : { emoji: null, label: title };
}

export interface NotesPanelProps {
  meeting: MeetingDetail;
  onSeek: (ms: number) => void;
  onRegenerate: () => void;
  regenerating: boolean;
  onCopyNotes: () => void;
  actionItemHandlers: {
    onToggle: (item: ActionItem) => void;
    onCreate: (text: string, assignee: Participant | null) => void;
    onUpdate: (item: ActionItem, text: string) => void;
    onDelete: (item: ActionItem) => void;
    pending: boolean;
  };
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-lg font-medium tracking-tight text-gray-900 dark:text-gray-100">{children}</h3>
  );
}

/** A "· " bullet row, matching the notes list in the real product. */
function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[11px] size-1 shrink-0 rounded-full bg-gray-400" />
      <span className="text-prose text-gray-700 dark:text-gray-300">{children}</span>
    </li>
  );
}

export function NotesPanel({
  meeting, onSeek, onRegenerate, regenerating, onCopyNotes, actionItemHandlers,
}: NotesPanelProps) {
  const [notesStyle, setNotesStyle] = useState("Default Notes");
  const summary = meeting.summary;

  const openCount = useMemo(
    () => meeting.action_items.filter((item) => item.status !== "completed").length,
    [meeting.action_items],
  );

  return (
    <div className="mx-auto w-full max-w-[820px] px-5 py-6 sm:px-8">
      {/* --- notes toolbar, mirroring the app's "Default Notes / Customize / AI Apps" row --- */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 pb-3">
        {/* The four-colour accent: the product's mark for generated content. */}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-ai-accent opacity-70" />
        <div className="flex items-center gap-3">
          <Dropdown
            align="start"
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-md font-medium text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400"
              >
                <Sparkles className="size-4" />
                <span className="bg-brand-radial bg-clip-text text-transparent">{notesStyle}</span>
                <ChevronDown className="size-3.5" />
              </button>
            }
            items={["Default Notes", "Sales Notes", "Interview Notes", "Standup Notes"].map((style) => ({
              key: style,
              label: style,
              selected: notesStyle === style,
              onSelect: () => setNotesStyle(style),
            }))}
          />
          <IconButton label="Copy notes to clipboard" size="sm" onClick={onCopyNotes}>
            <Copy className="size-4" />
          </IconButton>
          {summary && (
            <Badge color={SENTIMENT_COLORS[summary.sentiment] as "green" | "gray" | "red"} dot>
              {summary.sentiment}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            icon={<RefreshCw className={cn("size-3.5", regenerating && "animate-spin")} />}
            onClick={onRegenerate}
            disabled={regenerating || meeting.segments.length === 0}
          >
            {regenerating ? "Regenerating…" : "Regenerate"}
          </Button>
          <Button size="sm" variant="ghost" icon={<Plus className="size-3.5" />} disabled title="AI Apps are coming soon">
            AI Apps
          </Button>
          <Dropdown
            align="end"
            trigger={
              <IconButton label="More note actions" size="sm">
                <MoreHorizontal className="size-4" />
              </IconButton>
            }
            items={[
              { key: "md", label: "Download as Markdown", icon: <Download className="size-4" />, onSelect: () => { window.location.href = api.exportUrl(meeting.id, "md"); } },
              { key: "txt", label: "Download transcript (.txt)", icon: <Download className="size-4" />, onSelect: () => { window.location.href = api.exportUrl(meeting.id, "txt"); } },
              { key: "json", label: "Download raw JSON", icon: <Download className="size-4" />, onSelect: () => { window.location.href = api.exportUrl(meeting.id, "json"); } },
            ]}
          />
        </div>
      </div>

      {!summary ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-white/15">
          <Sparkles className="mx-auto size-6 text-gray-400" />
          <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-gray-100">No AI notes yet</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-base text-gray-500 dark:text-gray-400">
            {meeting.segments.length === 0
              ? "Add a transcript to this meeting and notes can be generated from it."
              : "Generate an overview, chapters and action items from this transcript."}
          </p>
          {meeting.segments.length > 0 && (
            <Button
              variant="primary"
              className="mt-5"
              loading={regenerating}
              icon={<Sparkles className="size-4" />}
              onClick={onRegenerate}
            >
              Generate notes
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-7 space-y-9">
          {summary.overview && (
            <section>
              <SectionHeading>Overview</SectionHeading>
              <p className="text-prose text-gray-700 dark:text-gray-300">{summary.overview}</p>
            </section>
          )}

          {meeting.topics.length > 0 && (
            <section>
              <SectionHeading>Notes</SectionHeading>
              <div className="space-y-6">
                {meeting.topics.map((topic) => {
                  const { emoji, label } = splitEmoji(topic.title);
                  return (
                    <div key={topic.id}>
                      <div className="flex items-baseline gap-2">
                        <span className="shrink-0 text-base leading-7" aria-hidden>
                          {emoji ?? "▪︎"}
                        </span>
                        <h4 className="text-md font-semibold leading-7 text-gray-900 dark:text-gray-100">
                          {label}
                          <button
                            type="button"
                            onClick={() => onSeek(topic.start_ms)}
                            className="ml-2 font-normal tabular-nums text-blue-700 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-800 dark:text-blue-400"
                          >
                            {formatTimestamp(topic.start_ms)} – {formatTimestamp(topic.end_ms)}
                          </button>
                        </h4>
                      </div>
                      <ul className="mt-1.5 space-y-1 pl-6">
                        {topic.bullets.map((bullet, index) => (
                          <Bullet key={index}>{bullet}</Bullet>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <ActionItemsSection
            items={meeting.action_items}
            participants={meeting.participants}
            openCount={openCount}
            onSeek={onSeek}
            {...actionItemHandlers}
          />

          {summary.bullet_points.length > 0 && (
            <section>
              <SectionHeading>Meeting Outcome</SectionHeading>
              <ul className="space-y-1">
                {summary.bullet_points.map((bullet, index) => (
                  <Bullet key={index}>{bullet}</Bullet>
                ))}
              </ul>
            </section>
          )}

          {summary.questions.length > 0 && (
            <section>
              <SectionHeading>Open Questions</SectionHeading>
              <ul className="space-y-2">
                {summary.questions.map((question, index) => (
                  <li key={index} className="flex gap-3">
                    <HelpCircle className="mt-1.5 size-4 shrink-0 text-gray-400" />
                    <span className="text-prose text-gray-700 dark:text-gray-300">{question}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary.keywords.length > 0 && (
            <section>
              <SectionHeading>Key Topics</SectionHeading>
              <div className="flex flex-wrap gap-2">
                {summary.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-gray-50 px-2.5 py-1 text-base text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          )}

          {meeting.participants.length > 0 && (
            <section>
              <SectionHeading>Speaker Talk Time</SectionHeading>
              <TalkTime participants={meeting.participants} />
            </section>
          )}

          <p className="border-t border-[var(--app-border)] pt-4 text-sm text-gray-400">
            {summary.generated_by === "llm"
              ? `Generated by ${summary.model_name ?? "an LLM"}.`
              : summary.generated_by === "manual"
                ? "Edited by hand."
                : summary.generated_by === "seed"
                  ? "Authored sample notes."
                  : "Generated by the built-in extractive summariser."}{" "}
            AI notes can be wrong — check them against the transcript.
          </p>
        </div>
      )}
    </div>
  );
}

function TalkTime({ participants }: { participants: Participant[] }) {
  const total = participants.reduce((sum, person) => sum + person.talk_time_seconds, 0) || 1;
  const ranked = [...participants].sort((a, b) => b.talk_time_seconds - a.talk_time_seconds);

  return (
    <div className="space-y-3">
      {ranked.map((person) => {
        const percent = Math.round((person.talk_time_seconds / total) * 100);
        return (
          <div key={person.id} className="flex items-center gap-3">
            <Avatar name={person.name} color={person.color} size="md" />
            <span className="w-36 shrink-0 truncate text-base text-gray-700 dark:text-gray-300">{person.name}</span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-purple-500 transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-sm tabular-nums text-gray-500 dark:text-gray-400">
              {percent}% · {formatTimestamp(person.talk_time_seconds * 1000)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

