"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUp, HelpCircle, Layers, Mic, MoreHorizontal, PanelRightClose, Plus, Sparkles, X,
} from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import type { SegmentMatch } from "@/lib/types";
import { cn, formatTimestamp } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { useSession } from "./SessionProvider";

interface Exchange {
  question: string;
  answer: string | null;
  citations: SegmentMatch[];
}

const SUGGESTIONS = [
  { emoji: "✅", label: "My action items", query: "What are my action items?" },
  { emoji: "🎯", label: "Key decisions", query: "What decisions were made?" },
  { emoji: "📌", label: "Key initiatives", query: "What are the main initiatives?" },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/**
 * The assistant column pinned to the right of the shell.
 *
 * It answers across the whole workspace: the question is run through global
 * search, and the highest-ranked meeting's `ask` endpoint produces a grounded
 * answer with citations. Cheaper than sending every transcript to a model, and
 * every claim stays traceable to a line someone actually said.
 */
export function AskFredPanel({ onClose }: { onClose: () => void }) {
  const { user } = useSession();
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);
  const [connectDismissed, setConnectDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: page } = useQuery({
    queryKey: queryKeys.meetings({ page_size: 1 }),
    queryFn: () => api.meetings({ page_size: 1 }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  const ask = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setQuestion("");
    setHistory((current) => [...current, { question: trimmed, answer: null, citations: [] }]);
    setBusy(true);
    try {
      const results = await api.search(trimmed);
      const meetingId =
        results.segments[0]?.meeting_id ?? results.meetings[0]?.id ?? page?.items[0]?.id ?? null;
      if (!meetingId) {
        throw new Error("No meetings to search yet.");
      }
      const answer = await api.ask(meetingId, trimmed);
      setHistory((current) =>
        current.map((row, index) =>
          index === current.length - 1 ? { ...row, answer: answer.answer, citations: answer.citations } : row,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setHistory((current) =>
        current.map((row, index) => (index === current.length - 1 ? { ...row, answer: message } : row)),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="hidden w-[400px] shrink-0 flex-col border-l border-[var(--app-border)] bg-[var(--app-surface)] xl:flex">
      <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[var(--app-border)] px-4">
        <span className="flex size-6 items-center justify-center rounded-sm bg-brand-gradient text-white">
          <Sparkles className="size-3.5 fill-current" />
        </span>
        <h2 className="flex-1 text-md font-medium text-gray-900 dark:text-gray-100">AskFred</h2>
        <Dropdown
          align="end"
          trigger={
            <IconButton label="Assistant options" size="sm">
              <MoreHorizontal className="size-4" />
            </IconButton>
          }
          items={[
            { key: "clear", label: "Clear conversation", onSelect: () => setHistory([]) },
            { key: "about", label: "Answers cite the transcript", disabled: true },
          ]}
        />
        <IconButton label="New conversation" size="sm" onClick={() => setHistory([])}>
          <Plus className="size-4" />
        </IconButton>
        <IconButton label="Hide assistant" size="sm" onClick={onClose}>
          <PanelRightClose className="size-4" />
        </IconButton>
      </header>

      <div ref={scrollRef} className="ff-scroll min-h-0 flex-1 overflow-y-auto">
        {!connectDismissed && (
          <div className="m-3 flex items-start gap-3 rounded-lg bg-purple-50 p-3 dark:bg-purple-500/10">
            <Layers className="mt-0.5 size-4 shrink-0 text-purple-600 dark:text-purple-300" />
            <p className="min-w-0 flex-1 text-base leading-5 text-gray-700 dark:text-gray-300">
              <span className="font-medium text-gray-900 dark:text-gray-100">Connect Slack and Gmail</span> — get
              answers with full context.
            </p>
            <Link href="/integrations" className="shrink-0 text-base font-medium text-purple-700 hover:underline dark:text-purple-300">
              Connect
            </Link>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setConnectDismissed(true)}
              className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {history.length === 0 ? (
          <div className="flex min-h-[340px] flex-col justify-center px-5">
            <Sparkles className="size-5 text-green-400" />
            <p className="mt-4 text-2xl font-medium leading-8 text-gray-900 dark:text-gray-100">
              Hi {user?.name?.split(" ")[0] ?? "there"}!
              <br />
              {greeting()} — ask me anything.
            </p>
            <div className="mt-6 flex flex-col items-start gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => ask(suggestion.query)}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-base text-gray-700 transition-colors hover:bg-gray-100 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  <span aria-hidden>{suggestion.emoji}</span>
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-5 p-4">
            {history.map((row, index) => (
              <li key={index} className="space-y-2">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-purple-600 px-3 py-2 text-base text-white">
                  {row.question}
                </p>
                {row.answer === null ? (
                  <p className="text-base text-gray-400">Reading your meetings…</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-base leading-6 text-gray-700 dark:text-gray-300">{row.answer}</p>
                    {row.citations.length > 0 && (
                      <div className="space-y-1.5 border-l-2 border-purple-200 pl-3 dark:border-purple-500/40">
                        {row.citations.slice(0, 3).map((citation) => (
                          <Link
                            key={citation.segment_id}
                            href={`/view/${citation.meeting_id}`}
                            className="block hover:opacity-80"
                          >
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {citation.speaker_name}
                            </span>
                            <span className="ml-1.5 text-sm tabular-nums text-blue-600 dark:text-blue-400">
                              {formatTimestamp(citation.start_ms)}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-sm leading-5 text-gray-500">
                              {citation.snippet}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Floating help affordance, pinned above the composer. */}
      <div className="pointer-events-none relative">
        <a
          href="https://github.com/kunalKumar-13/minutes#readme"
          target="_blank"
          rel="noreferrer"
          aria-label="How this assistant works"
          title="How this assistant works"
          className="pointer-events-auto absolute -top-16 right-4 flex size-10 items-center justify-center rounded-full bg-purple-700 text-white shadow-e3 transition-colors hover:bg-purple-800"
        >
          <HelpCircle className="size-5" />
        </a>
      </div>

      <div className="shrink-0 p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            ask(question);
          }}
          className="rounded-xl border border-gray-200 bg-white p-2 shadow-e1 focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-100 dark:border-white/10 dark:bg-ink-500 dark:focus-within:ring-purple-500/15"
        >
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask anything. Type / to run AI skills."
            aria-label="Ask a question about your meetings"
            className="w-full bg-transparent px-1.5 py-1.5 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-gray-100"
          />
          <div className="flex items-center gap-1">
            <IconButton label="Attach" size="sm" type="button">
              <Plus className="size-4" />
            </IconButton>
            <IconButton label="AI skills" size="sm" type="button">
              <Layers className="size-4" />
            </IconButton>
            <span className="flex-1" />
            <IconButton label="Voice input" size="sm" type="button">
              <Mic className="size-4" />
            </IconButton>
            <button
              type="submit"
              disabled={!question.trim() || busy}
              aria-label="Send"
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors",
                question.trim() && !busy
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-purple-100 text-purple-300 dark:bg-white/5 dark:text-gray-600",
              )}
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
