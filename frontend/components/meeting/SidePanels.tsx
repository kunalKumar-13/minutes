"use client";

import { useState } from "react";
import {
  Bookmark, Copy, Link2, ListTree, MessageSquare, Scissors, Send, Sparkles, Trash2, X,
} from "lucide-react";
import type { AskResponse, Comment, MeetingDetail, Soundbite } from "@/lib/types";
import { cn, formatRelative, formatTimestamp } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Textarea } from "@/components/ui/Input";

export type RailPanel = "outline" | "comments" | "soundbites" | "ask" | null;

export const RAIL_ITEMS: { key: Exclude<RailPanel, null>; label: string; icon: React.ReactNode }[] = [
  { key: "outline", label: "Outline", icon: <ListTree className="size-[18px]" /> },
  { key: "ask", label: "Ask about this meeting", icon: <Sparkles className="size-[18px]" /> },
  { key: "soundbites", label: "Soundbites", icon: <Scissors className="size-[18px]" /> },
  { key: "comments", label: "Comments", icon: <MessageSquare className="size-[18px]" /> },
];

export function MeetingRail({
  active, onChange, counts,
}: {
  active: RailPanel;
  onChange: (panel: RailPanel) => void;
  counts: { comments: number; soundbites: number };
}) {
  return (
    <nav
      aria-label="Meeting tools"
      className="ff-surface flex w-[60px] shrink-0 flex-col items-center gap-1 border-r py-3"
    >
      {RAIL_ITEMS.map((item) => {
        const count =
          item.key === "comments" ? counts.comments : item.key === "soundbites" ? counts.soundbites : 0;
        return (
          <button
            key={item.key}
            type="button"
            aria-label={item.label}
            aria-pressed={active === item.key}
            title={item.label}
            onClick={() => onChange(active === item.key ? null : item.key)}
            className={cn(
              "relative flex size-9 items-center justify-center rounded-md transition-colors",
              active === item.key
                ? "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5",
            )}
          >
            {item.icon}
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-semibold text-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function PanelShell({
  title, onClose, children, footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <aside className="ff-surface flex h-full w-[330px] shrink-0 flex-col border-r">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
        <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <IconButton label="Close panel" size="sm" onClick={onClose}>
          <X className="size-4" />
        </IconButton>
      </header>
      <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      {footer && <div className="shrink-0 border-t border-[var(--app-border)] p-3">{footer}</div>}
    </aside>
  );
}

export interface MeetingPanelProps {
  panel: RailPanel;
  meeting: MeetingDetail;
  onClose: () => void;
  onSeek: (ms: number) => void;
  onAddComment: (body: string) => void;
  onDeleteComment: (comment: Comment) => void;
  onDeleteSoundbite: (soundbite: Soundbite) => void;
  onAsk: (question: string) => Promise<AskResponse>;
}

export function MeetingPanel({
  panel, meeting, onClose, onSeek, onAddComment, onDeleteComment, onDeleteSoundbite, onAsk,
}: MeetingPanelProps) {
  if (panel === null) return null;

  if (panel === "outline") {
    return (
      <PanelShell title="Outline" onClose={onClose}>
        {meeting.topics.length === 0 ? (
          <EmptyState icon={<ListTree className="size-5" />} title="No chapters" description="Generate notes to build an outline." />
        ) : (
          <ol className="space-y-1">
            {meeting.topics.map((topic) => (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() => onSeek(topic.start_ms)}
                  className="w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <span className="block text-base font-medium text-gray-900 dark:text-gray-100">{topic.title}</span>
                  <span className="mt-0.5 block text-sm tabular-nums text-blue-700 dark:text-blue-400">
                    {formatTimestamp(topic.start_ms)} – {formatTimestamp(topic.end_ms)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </PanelShell>
    );
  }

  if (panel === "comments") return <CommentsPanel meeting={meeting} onClose={onClose} onSeek={onSeek} onAdd={onAddComment} onDelete={onDeleteComment} />;
  if (panel === "soundbites") return <SoundbitesPanel meeting={meeting} onClose={onClose} onSeek={onSeek} onDelete={onDeleteSoundbite} />;
  return <AskPanel meeting={meeting} onClose={onClose} onSeek={onSeek} onAsk={onAsk} />;
}

function CommentsPanel({
  meeting, onClose, onSeek, onAdd, onDelete,
}: {
  meeting: MeetingDetail;
  onClose: () => void;
  onSeek: (ms: number) => void;
  onAdd: (body: string) => void;
  onDelete: (comment: Comment) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <PanelShell
      title={`Comments (${meeting.comments.length})`}
      onClose={onClose}
      footer={
        <div className="space-y-2">
          <Textarea
            value={draft}
            rows={2}
            placeholder="Leave a comment…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && draft.trim()) {
                onAdd(draft.trim());
                setDraft("");
              }
            }}
          />
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            icon={<Send className="size-3.5" />}
            disabled={!draft.trim()}
            onClick={() => {
              onAdd(draft.trim());
              setDraft("");
            }}
          >
            Comment
          </Button>
        </div>
      }
    >
      {meeting.comments.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-5" />}
          title="No comments yet"
          description="Comment on the meeting, or on a single transcript line."
        />
      ) : (
        <ul className="space-y-3">
          {meeting.comments.map((comment) => (
            <li key={comment.id} className="group rounded-lg border border-[var(--app-border)] p-3">
              <div className="flex items-center gap-2">
                <Avatar name={comment.author_name} size="sm" />
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">{comment.author_name}</span>
                <span className="text-sm text-gray-400">{formatRelative(comment.created_at)}</span>
                <IconButton
                  label="Delete comment"
                  size="sm"
                  className="ml-auto opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                  onClick={() => onDelete(comment)}
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </div>
              <p className="mt-1.5 text-base leading-6 text-gray-700 dark:text-gray-300">{comment.body}</p>
              {comment.timestamp_ms !== null && (
                <button
                  type="button"
                  onClick={() => onSeek(comment.timestamp_ms!)}
                  className="mt-1.5 text-sm tabular-nums text-blue-700 underline decoration-blue-300 underline-offset-2 dark:text-blue-400"
                >
                  {formatTimestamp(comment.timestamp_ms)}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

function SoundbitesPanel({
  meeting, onClose, onSeek, onDelete,
}: {
  meeting: MeetingDetail;
  onClose: () => void;
  onSeek: (ms: number) => void;
  onDelete: (soundbite: Soundbite) => void;
}) {
  return (
    <PanelShell title={`Soundbites (${meeting.soundbites.length})`} onClose={onClose}>
      {meeting.soundbites.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-5" />}
          title="No soundbites"
          description="Clip a moment from the transcript or the player to save it here."
        />
      ) : (
        <ul className="space-y-3">
          {meeting.soundbites.map((soundbite) => (
            <li key={soundbite.id} className="group rounded-lg border border-[var(--app-border)] p-3">
              <div className="flex items-start gap-2">
                <Scissors className="mt-0.5 size-4 shrink-0 text-purple-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{soundbite.title}</p>
                  <button
                    type="button"
                    onClick={() => onSeek(soundbite.start_ms)}
                    className="mt-0.5 text-sm tabular-nums text-blue-700 underline decoration-blue-300 underline-offset-2 dark:text-blue-400"
                  >
                    {formatTimestamp(soundbite.start_ms)} – {formatTimestamp(soundbite.end_ms)}
                  </button>
                </div>
                <IconButton
                  label="Delete soundbite"
                  size="sm"
                  className="opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                  onClick={() => onDelete(soundbite)}
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </div>
              {soundbite.transcript_excerpt && (
                <p className="mt-2 line-clamp-4 text-sm leading-5 text-gray-600 dark:text-gray-400">
                  “{soundbite.transcript_excerpt}”
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

interface Exchange {
  question: string;
  answer: AskResponse | null;
}

function AskPanel({
  meeting, onClose, onSeek, onAsk,
}: {
  meeting: MeetingDetail;
  onClose: () => void;
  onSeek: (ms: number) => void;
  onAsk: (question: string) => Promise<AskResponse>;
}) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);

  const suggestions = [
    "What was decided?",
    "What are my action items?",
    "What concerns were raised?",
  ];

  const ask = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setQuestion("");
    setHistory((current) => [...current, { question: trimmed, answer: null }]);
    setBusy(true);
    try {
      const answer = await onAsk(trimmed);
      setHistory((current) => current.map((row, index) => (index === current.length - 1 ? { ...row, answer } : row)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelShell
      title="Ask this meeting"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Input
            value={question}
            placeholder="Ask a question…"
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && ask(question)}
          />
          <Button variant="primary" size="md" disabled={!question.trim() || busy} onClick={() => ask(question)}>
            <Send className="size-4" />
          </Button>
        </div>
      }
    >
      {history.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-purple-25 p-3 ring-1 ring-inset ring-purple-100 dark:bg-purple-500/5 dark:ring-purple-500/20">
            <p className="flex items-center gap-1.5 text-base font-medium text-gray-900 dark:text-gray-100">
              <Sparkles className="size-3.5 text-purple-600" />
              Grounded in the transcript
            </p>
            <p className="mt-1 text-sm leading-5 text-gray-600 dark:text-gray-400">
              Every answer cites the lines it came from, so you can check it against what was actually said.
            </p>
          </div>
          <div className="space-y-1.5">
            {suggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => ask(prompt)}
                className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-left text-base text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="space-y-5">
          {history.map((row, index) => (
            <li key={index} className="space-y-2">
              <p className="rounded-lg bg-gray-100 px-3 py-2 text-base text-gray-900 dark:bg-white/10 dark:text-gray-100">
                {row.question}
              </p>
              {row.answer === null ? (
                <p className="px-1 text-base text-gray-400">Reading the transcript…</p>
              ) : (
                <div className="space-y-2 px-1">
                  <p className="text-base leading-6 text-gray-700 dark:text-gray-300">{row.answer.answer}</p>
                  {row.answer.citations.length > 0 && (
                    <div className="space-y-1.5 border-l-2 border-purple-200 pl-3 dark:border-purple-500/40">
                      {row.answer.citations.slice(0, 3).map((citation) => (
                        <button
                          key={citation.segment_id}
                          type="button"
                          onClick={() => onSeek(citation.start_ms)}
                          className="block w-full text-left"
                        >
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {citation.speaker_name}
                          </span>
                          <span className="ml-1.5 text-sm tabular-nums text-blue-700 dark:text-blue-400">
                            {formatTimestamp(citation.start_ms)}
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-sm leading-5 text-gray-500 dark:text-gray-500">
                            {citation.snippet}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    {row.answer.generated_by === "llm" ? "Answered by an LLM over the transcript." : "Retrieved from the transcript."}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="sr-only">{meeting.title}</p>
    </PanelShell>
  );
}

export function ShareModalBody({ meeting, onCopied }: { meeting: MeetingDetail; onCopied: () => void }) {
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/view/${meeting.id}`;
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input readOnly value={url} onFocus={(event) => event.currentTarget.select()} />
        <Button
          className="shrink-0"
          icon={<Copy className="size-4" />}
          onClick={() => {
            navigator.clipboard.writeText(url);
            onCopied();
          }}
        >
          Copy
        </Button>
      </div>
      <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/5">
        <p className="flex items-center gap-1.5 text-base font-medium text-gray-900 dark:text-gray-100">
          <Link2 className="size-3.5" />
          Anyone with this workspace can open it
        </p>
        <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
          Per-person permissions, public share links and team channels are part of the collaboration work that
          isn&apos;t in this build.
        </p>
      </div>
    </div>
  );
}
