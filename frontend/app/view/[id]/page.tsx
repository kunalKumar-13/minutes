"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark, Download, Eye, MessageSquare, MoreHorizontal, Pencil,
  Search, Sparkles, Trash2, Video, Waves,
} from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import type { ActionItem, Comment, Participant, Segment, Soundbite } from "@/lib/types";
import { cn, formatMeetingDate, formatTimestamp } from "@/lib/utils";
import { useMediaPlayer } from "@/lib/useMediaPlayer";
import { AppShell } from "@/components/layout/AppShell";
import { AvatarStack } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { TranscriptSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { EditMeetingModal } from "@/components/meetings/EditMeetingModal";
import { NotesPanel } from "@/components/meeting/NotesPanel";
import { PlayerBar } from "@/components/meeting/PlayerBar";
import { SmartSearchPanel } from "@/components/meeting/SmartSearchPanel";
import { TranscriptPanel } from "@/components/meeting/TranscriptPanel";
import { MeetingPanel, ShareModalBody, type RailPanel } from "@/components/meeting/SidePanels";

/** The meeting's own 48px rail — which left-hand panel is showing. */
const LEFT_RAIL: { key: LeftPanel; label: string; icon: React.ReactNode }[] = [
  { key: "smart", label: "Smart Search", icon: <Search className="size-[18px]" /> },
  { key: "soundbites", label: "Soundbites", icon: <Waves className="size-[18px]" /> },
  { key: "comments", label: "Comments", icon: <MessageSquare className="size-[18px]" /> },
  { key: "outline", label: "Outline", icon: <Bookmark className="size-[18px]" /> },
];

type LeftPanel = "smart" | "soundbites" | "comments" | "outline";
type RightTab = "askfred" | "transcript";
type CenterTab = "notes" | "skills";

export default function MeetingView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [leftPanel, setLeftPanel] = useState<LeftPanel>("smart");
  const [rightTab, setRightTab] = useState<RightTab>("transcript");
  const [centerTab, setCenterTab] = useState<CenterTab>("notes");
  const [smartQuery, setSmartQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const meetingQuery = useQuery({
    queryKey: queryKeys.meeting(id),
    queryFn: () => api.meeting(id),
    enabled: Boolean(id),
  });
  const meeting = meetingQuery.data;

  const insightsQuery = useQuery({
    queryKey: queryKeys.insights(id),
    queryFn: () => api.insights(id),
    enabled: Boolean(id) && Boolean(meeting?.segment_count),
  });

  const player = useMediaPlayer(meeting?.duration_seconds ?? 0, meeting?.media_url);
  const { seek } = player;

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meeting(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.insights(id) });
    queryClient.invalidateQueries({ queryKey: ["meetings"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  }, [queryClient, id]);

  const fail = useCallback((message: string) => () => toast.error(message), [toast]);

  // ------------------------------------------------------------- mutations
  const regenerate = useMutation({
    mutationFn: () => api.regenerateSummary(id),
    onSuccess: () => {
      refresh();
      toast.success("Notes regenerated", "Completed and manually-added action items were kept.");
    },
    onError: fail("Could not regenerate the notes"),
  });

  const toggleTask = useMutation({
    mutationFn: (item: ActionItem) =>
      api.updateActionItem(item.id, { status: item.status === "completed" ? "open" : "completed" }),
    onSuccess: refresh,
    onError: fail("Could not update that action item"),
  });

  const createTask = useMutation({
    mutationFn: ({ text, assignee }: { text: string; assignee: Participant | null }) =>
      api.createActionItem(id, { text, assignee_id: assignee?.id ?? null }),
    onSuccess: () => {
      refresh();
      toast.success("Action item added");
    },
    onError: fail("Could not add that action item"),
  });

  const updateTask = useMutation({
    mutationFn: ({ item, text }: { item: ActionItem; text: string }) => api.updateActionItem(item.id, { text }),
    onSuccess: refresh,
    onError: fail("Could not save that action item"),
  });

  const deleteTask = useMutation({
    mutationFn: (item: ActionItem) => api.deleteActionItem(item.id),
    onSuccess: () => {
      refresh();
      toast.success("Action item deleted");
    },
    onError: fail("Could not delete that action item"),
  });

  const editSegment = useMutation({
    mutationFn: ({ segmentId, text }: { segmentId: string; text: string }) =>
      api.updateSegment(id, segmentId, { text }),
    onSuccess: () => {
      refresh();
      toast.success("Transcript updated");
    },
    onError: fail("Could not update that line"),
  });

  const reassignSpeaker = useMutation({
    mutationFn: ({ segmentId, participantId }: { segmentId: string; participantId: string }) =>
      api.updateSegment(id, segmentId, { speaker_id: participantId }),
    onSuccess: () => {
      refresh();
      toast.success("Speaker reassigned");
    },
    onError: fail("Could not reassign the speaker"),
  });

  const addComment = useMutation({
    mutationFn: ({ body, segmentId }: { body: string; segmentId?: string | null }) =>
      api.createComment(id, { body, segment_id: segmentId ?? null }),
    onSuccess: () => {
      refresh();
      toast.success("Comment added");
    },
    onError: fail("Could not post that comment"),
  });

  const removeComment = useMutation({
    mutationFn: (comment: Comment) => api.deleteComment(comment.id),
    onSuccess: refresh,
    onError: fail("Could not delete that comment"),
  });

  const addSoundbite = useMutation({
    mutationFn: ({ title, start, end }: { title: string; start: number; end: number }) =>
      api.createSoundbite(id, { title, start_ms: start, end_ms: end }),
    onSuccess: () => {
      refresh();
      queryClient.invalidateQueries({ queryKey: queryKeys.soundbites });
      toast.success("Soundbite saved");
      setLeftPanel("soundbites");
    },
    onError: fail("Could not save that soundbite"),
  });

  const removeSoundbite = useMutation({
    mutationFn: (soundbite: Soundbite) => api.deleteSoundbite(soundbite.id),
    onSuccess: () => {
      refresh();
      queryClient.invalidateQueries({ queryKey: queryKeys.soundbites });
    },
    onError: fail("Could not delete that soundbite"),
  });

  const favorite = useMutation({
    mutationFn: () => api.toggleFavorite(id),
    onSuccess: (updated) => {
      refresh();
      toast.success(updated.is_favorite ? "Added to favourites" : "Removed from favourites");
    },
    onError: fail("Could not update this meeting"),
  });

  const deleteMeeting = useMutation({
    mutationFn: () => api.deleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted");
      router.push("/notebook/mine-shared");
    },
    onError: fail("Could not delete this meeting"),
  });

  const copyNotes = useCallback(() => {
    if (!meeting) return;
    const lines: string[] = [meeting.title, ""];
    if (meeting.summary?.overview) lines.push("OVERVIEW", meeting.summary.overview, "");
    meeting.topics.forEach((topic) => {
      lines.push(`${topic.title} (${formatTimestamp(topic.start_ms)}–${formatTimestamp(topic.end_ms)})`);
      topic.bullets.forEach((bullet) => lines.push(`  • ${bullet}`));
      lines.push("");
    });
    if (meeting.action_items.length) {
      lines.push("ACTION ITEMS");
      meeting.action_items.forEach((item) =>
        lines.push(`  [${item.status === "completed" ? "x" : " "}] ${item.assignee_name ?? "Unassigned"}: ${item.text}`),
      );
    }
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Notes copied to clipboard");
  }, [meeting, toast]);

  const soundbiteFromSegment = useCallback(
    (segment: Segment) =>
      addSoundbite.mutate({
        title: segment.text.slice(0, 70).trim() + (segment.text.length > 70 ? "…" : ""),
        start: segment.start_ms,
        end: segment.end_ms,
      }),
    [addSoundbite],
  );

  const heading = useMemo(
    () => (
      <span className="flex min-w-0 items-center gap-2">
        <Link
          href="/notebook/all"
          className="shrink-0 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          #{meeting?.tags[0]?.name ?? "All Meetings"}
        </Link>
        <span className="shrink-0 text-gray-300 dark:text-gray-600">/</span>
        <span className="max-w-[34ch] truncate text-gray-900 dark:text-gray-100">
          {meeting?.title ?? "Loading…"}
        </span>
        {meeting && (
          <Dropdown
            align="start"
            trigger={
              <IconButton label="Meeting actions" size="sm">
                <MoreHorizontal className="size-4" />
              </IconButton>
            }
            items={[
              { key: "edit", label: "Edit details", icon: <Pencil className="size-4" />, onSelect: () => setEditOpen(true) },
              { key: "md", label: "Download Markdown", icon: <Download className="size-4" />, separatorBefore: true, onSelect: () => { window.location.href = api.exportUrl(meeting.id, "md"); } },
              { key: "txt", label: "Download transcript", icon: <Download className="size-4" />, onSelect: () => { window.location.href = api.exportUrl(meeting.id, "txt"); } },
              { key: "json", label: "Download JSON", icon: <Download className="size-4" />, onSelect: () => { window.location.href = api.exportUrl(meeting.id, "json"); } },
              { key: "delete", label: "Delete meeting", icon: <Trash2 className="size-4" />, destructive: true, separatorBefore: true, onSelect: () => setDeleteOpen(true) },
            ]}
          />
        )}
      </span>
    ),
    [meeting],
  );

  if (meetingQuery.isLoading) {
    return (
      <AppShell title={heading} chromeless scroll={false}>
        <TranscriptSkeleton />
      </AppShell>
    );
  }

  if (meetingQuery.isError || !meeting) {
    return (
      <AppShell title={heading} chromeless>
        <div className="px-6 py-16 text-center">
          <h1 className="font-appDisplay text-3xl font-medium text-gray-900 dark:text-gray-100">
            Couldn&apos;t load this meeting
          </h1>
          <p className="mt-2 text-md text-gray-500 dark:text-gray-400">
            {(meetingQuery.error as Error | undefined)?.message ?? "It may have been deleted."}
          </p>
          <Button variant="primary" className="mt-5" onClick={() => router.push("/notebook/mine-shared")}>
            Back to meetings
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={heading}
      chromeless
      scroll={false}
      footer={
        <PlayerBar
          player={player}
          mediaUrl={meeting.media_url}
          mediaType={meeting.media_type}
          title={meeting.title}
          isFavorite={meeting.is_favorite}
          onToggleFavorite={() => favorite.mutate()}
          onDownload={() => { window.location.href = api.exportUrl(meeting.id, "txt"); }}
          onRate={(positive) =>
            toast.success(positive ? "Thanks — noted" : "Thanks, we'll use that", "Feedback isn't persisted in this build.")
          }
          onCreateSoundbite={() =>
            addSoundbite.mutate({
              title: `Clip at ${formatTimestamp(player.currentMs)}`,
              start: Math.max(0, player.currentMs - 15_000),
              end: Math.min(player.durationMs, player.currentMs + 15_000),
            })
          }
        />
      }
    >
      <div className="flex h-full min-h-0">
        {/* ------------------------------------------------ meeting rail (48) */}
        <nav
          aria-label="Meeting panels"
          className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-[var(--app-border)] bg-[var(--app-surface)] py-3 md:flex"
        >
          {LEFT_RAIL.map((item) => {
            const count =
              item.key === "comments" ? meeting.comments.length
              : item.key === "soundbites" ? meeting.soundbites.length
              : 0;
            return (
              <button
                key={item.key}
                type="button"
                aria-label={item.label}
                aria-pressed={leftPanel === item.key}
                title={item.label}
                onClick={() => setLeftPanel(item.key)}
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-sm transition-colors",
                  leftPanel === item.key
                    ? "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-white/5",
                )}
              >
                {item.icon}
                {count > 0 && (
                  <span className="absolute right-0 top-0.5 flex size-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-semibold text-white">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* --------------------------------------------- left panel (340) */}
        {leftPanel === "smart" ? (
          <SmartSearchPanel
            insights={insightsQuery.data}
            loading={insightsQuery.isLoading}
            query={smartQuery}
            onQueryChange={setSmartQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onSeek={seek}
          />
        ) : (
          <div className="hidden xl:flex">
            <MeetingPanel
              panel={leftPanel as RailPanel}
              meeting={meeting}
              onClose={() => setLeftPanel("smart")}
              onSeek={seek}
              onAddComment={(body) => addComment.mutate({ body })}
              onDeleteComment={(comment) => removeComment.mutate(comment)}
              onDeleteSoundbite={(soundbite) => removeSoundbite.mutate(soundbite)}
              onAsk={(question) => api.ask(id, question)}
            />
          </div>
        )}

        {/* -------------------------------------------------------- centre */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-center gap-1 border-b border-[var(--app-border)] px-4 py-2.5">
            <div className="flex items-center gap-1 rounded-md bg-gray-100 p-0.5 dark:bg-white/5">
              {(
                [
                  { key: "notes", label: "Notes" },
                  { key: "skills", label: `AI Skills · ${meeting.topics.length}` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCenterTab(tab.key)}
                  className={cn(
                    "rounded-sm px-3 py-1.5 text-base font-medium transition-colors",
                    centerTab === tab.key
                      ? "bg-white text-gray-900 shadow-e1 dark:bg-ink-500 dark:text-gray-100"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ff-scroll min-h-0 flex-1 overflow-y-auto">
            {centerTab === "notes" ? (
              <>
                <header className="mx-auto w-full max-w-[720px] px-6 pt-8">
                  <div className="flex items-start gap-4">
                    <h1 className="min-w-0 flex-1 font-appDisplay text-3xl font-normal leading-8 tracking-title text-gray-900 dark:text-gray-100">
                      {meeting.title}
                    </h1>
                    <button
                      type="button"
                      disabled
                      title="No recording is attached to this meeting"
                      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-sm border border-gray-200 px-3 text-base text-gray-300 dark:border-white/10 dark:text-gray-600"
                    >
                      <Video className="size-4" />
                      Video
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-gray-600 dark:text-gray-400">
                    <AvatarStack
                      people={meeting.participants.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
                      max={1}
                      size="sm"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {meeting.participants[0]?.name ?? "No participants"}
                    </span>
                    {meeting.participants.length > 1 && (
                      <span className="text-gray-500 underline decoration-gray-300 underline-offset-2">
                        +{meeting.participants.length - 1}
                      </span>
                    )}
                    <span>{formatMeetingDate(meeting.meeting_date)}</span>
                    <span>English (Global)</span>
                  </div>
                </header>

                <NotesPanel
                  meeting={meeting}
                  onSeek={seek}
                  onRegenerate={() => regenerate.mutate()}
                  regenerating={regenerate.isPending}
                  onCopyNotes={copyNotes}
                  actionItemHandlers={{
                    onToggle: (item) => toggleTask.mutate(item),
                    onCreate: (text, assignee) => createTask.mutate({ text, assignee }),
                    onUpdate: (item, text) => updateTask.mutate({ item, text }),
                    onDelete: (item) => deleteTask.mutate(item),
                    pending: createTask.isPending || updateTask.isPending,
                  }}
                />
              </>
            ) : (
              <div className="mx-auto max-w-[720px] px-6 py-10">
                <h2 className="flex items-center gap-2 text-xl font-medium text-gray-900 dark:text-gray-100">
                  <Sparkles className="size-4 text-purple-600" />
                  AI Skills
                </h2>
                <p className="mt-2 text-prose text-gray-600 dark:text-gray-400">
                  Skills are custom prompts run over this transcript to produce an extra notes section. The chapters
                  below were produced by the built-in notes engine, which is the same mechanism with a fixed prompt.
                </p>
                <ul className="mt-6 space-y-2">
                  {meeting.topics.map((topic) => (
                    <li
                      key={topic.id}
                      className="rounded-md border border-[var(--app-border)] p-4"
                    >
                      <p className="text-md font-medium text-gray-900 dark:text-gray-100">{topic.title}</p>
                      <button
                        type="button"
                        onClick={() => seek(topic.start_ms)}
                        className="mt-1 text-base tabular-nums text-blue-700 underline decoration-blue-300 underline-offset-2 dark:text-blue-400"
                      >
                        {formatTimestamp(topic.start_ms)} – {formatTimestamp(topic.end_ms)}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-md bg-gray-50 p-4 text-base leading-6 text-gray-600 dark:bg-white/5 dark:text-gray-400">
                  Authoring your own skill prompts is a placeholder in this build — see{" "}
                  <Link href="/skills" className="font-medium text-purple-700 hover:underline dark:text-purple-300">
                    AI Skills
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </div>

        {/* --------------------------------------------- right panel (432) */}
        <aside className="hidden w-[432px] shrink-0 flex-col border-l border-[var(--app-border)] bg-[var(--app-surface)] lg:flex">
          <div className="flex h-[52px] shrink-0 items-center gap-4 border-b border-[var(--app-border)] px-4">
            {(
              [
                { key: "askfred", label: "AskFred" },
                { key: "transcript", label: "Transcript" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRightTab(tab.key)}
                className={cn(
                  "-mb-px flex items-center gap-1.5 border-b-2 py-3.5 text-base font-medium transition-colors",
                  rightTab === tab.key
                    ? "border-purple-600 text-purple-700 dark:text-purple-300"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400",
                )}
              >
                {tab.key === "askfred" && (
                  <span className="flex size-5 items-center justify-center rounded-sm bg-brand-gradient text-white">
                    <Sparkles className="size-3 fill-current" />
                  </span>
                )}
                {tab.label}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-1 text-base text-gray-400">
              <Eye className="size-3.5" />1
            </span>
          </div>

          <div className="min-h-0 flex-1">
            {rightTab === "transcript" ? (
              <TranscriptPanel
                segments={meeting.segments}
                participants={meeting.participants}
                comments={meeting.comments}
                currentMs={player.currentMs}
                playing={player.playing}
                onSeek={seek}
                showHeader={false}
                searchPlaceholder="Find or Replace"
                onEditSegment={(segmentId, text) => editSegment.mutateAsync({ segmentId, text })}
                onReassignSpeaker={(segmentId, participantId) =>
                  reassignSpeaker.mutateAsync({ segmentId, participantId })
                }
                onCommentOn={(segment) => {
                  seek(segment.start_ms);
                  setLeftPanel("comments");
                }}
                onSoundbiteFrom={soundbiteFromSegment}
                onCopied={() => toast.success("Copied to clipboard")}
              />
            ) : (
              <MeetingPanel
                panel="ask"
                meeting={meeting}
                onClose={() => setRightTab("transcript")}
                onSeek={seek}
                onAddComment={(body) => addComment.mutate({ body })}
                onDeleteComment={(comment) => removeComment.mutate(comment)}
                onDeleteSoundbite={(soundbite) => removeSoundbite.mutate(soundbite)}
                onAsk={(question) => api.ask(id, question)}
              />
            )}
          </div>
        </aside>
      </div>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share this meeting" size="md">
        <ShareModalBody meeting={meeting} onCopied={() => toast.success("Link copied")} />
      </Modal>

      <EditMeetingModal
        meeting={editOpen ? meeting : null}
        participants={meeting.participants}
        onClose={() => setEditOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMeeting.mutate()}
        loading={deleteMeeting.isPending}
        destructive
        title="Delete this meeting?"
        confirmLabel="Delete meeting"
        message={`“${meeting.title}”, its transcript, notes and action items will be permanently removed.`}
      />
    </AppShell>
  );
}

