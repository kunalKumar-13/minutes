"use client";

import Link from "next/link";
import {
  Clock, Download, FileText, MoreHorizontal, Pencil, Star, Trash2, Video, Mic,
} from "lucide-react";
import type { Meeting } from "@/lib/types";
import { api } from "@/lib/api";
import { cn, formatDuration, formatMeetingDate, highlightParts } from "@/lib/utils";
import { AvatarStack } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
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

export interface MeetingRowProps {
  meeting: Meeting;
  query?: string;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  onToggleFavorite: (meeting: Meeting) => void;
  onEdit: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => void;
}

export function MeetingRow({
  meeting, query = "", selected, onSelectedChange, onToggleFavorite, onEdit, onDelete,
}: MeetingRowProps) {
  const MediaIcon = meeting.media_type === "video" ? Video : Mic;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 border-b border-[var(--app-border)] px-4 py-3 transition-colors",
        selected ? "bg-purple-25 dark:bg-purple-500/5" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]",
      )}
    >
      <Checkbox
        checked={selected}
        onChange={(event) => onSelectedChange(event.target.checked)}
        aria-label={`Select ${meeting.title}`}
        className={cn("transition-opacity", selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100")}
      />

      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:text-gray-500 dark:ring-white/10">
        <MediaIcon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/view/${meeting.id}`}
            className="truncate text-md font-medium text-gray-900 transition-colors hover:text-purple-700 dark:text-gray-100 dark:hover:text-purple-300"
          >
            <Highlighted text={meeting.title} query={query} />
          </Link>
          {meeting.is_favorite && <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />}
        </div>

        <p className="mt-0.5 truncate text-base text-gray-500 dark:text-gray-400">
          {meeting.gist ? (
            <Highlighted text={meeting.gist} query={query} />
          ) : (
            `${meeting.participants.length} participant${meeting.participants.length === 1 ? "" : "s"} · ${meeting.segment_count} transcript lines`
          )}
        </p>

        {meeting.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {meeting.tags.map((tag) => (
              <Badge key={tag.id} color={tag.color}>
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <AvatarStack
        people={meeting.participants.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
        className="hidden shrink-0 md:flex"
      />

      {meeting.open_action_item_count > 0 && (
        <Badge color="purple" className="hidden shrink-0 lg:inline-flex">
          {meeting.open_action_item_count} open
        </Badge>
      )}

      <span className="hidden w-16 shrink-0 items-center gap-1.5 text-base tabular-nums text-gray-500 sm:flex dark:text-gray-400">
        <Clock className="size-3.5" />
        {formatDuration(meeting.duration_seconds)}
      </span>

      <span className="hidden w-[136px] shrink-0 whitespace-nowrap text-right text-base tabular-nums text-gray-500 sm:block dark:text-gray-400">
        {formatMeetingDate(meeting.meeting_date)}
      </span>

      <div className="flex shrink-0 items-center">
        <IconButton
          label={meeting.is_favorite ? "Remove from favourites" : "Add to favourites"}
          size="sm"
          onClick={() => onToggleFavorite(meeting)}
        >
          <Star className={cn("size-4", meeting.is_favorite && "fill-yellow-400 text-yellow-400")} />
        </IconButton>

        <Dropdown
          align="end"
          trigger={
            <IconButton label={`Actions for ${meeting.title}`} size="sm">
              <MoreHorizontal className="size-4" />
            </IconButton>
          }
          items={[
            { key: "open", label: "Open meeting", icon: <FileText className="size-4" />, onSelect: () => { window.location.href = `/view/${meeting.id}`; } },
            { key: "edit", label: "Edit details", icon: <Pencil className="size-4" />, onSelect: () => onEdit(meeting) },
            { key: "md", label: "Download Markdown", icon: <Download className="size-4" />, separatorBefore: true, onSelect: () => { window.location.href = api.exportUrl(meeting.id, "md"); } },
            { key: "txt", label: "Download transcript (.txt)", icon: <Download className="size-4" />, onSelect: () => { window.location.href = api.exportUrl(meeting.id, "txt"); } },
            { key: "delete", label: "Delete meeting", icon: <Trash2 className="size-4" />, destructive: true, separatorBefore: true, onSelect: () => onDelete(meeting) },
          ]}
        />
      </div>
    </div>
  );
}
