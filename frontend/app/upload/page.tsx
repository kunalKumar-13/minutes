"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileJson, FileText, Upload } from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import { formatMeetingDate } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { ChannelSidebar } from "@/components/layout/ChannelSidebar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreateMeetingModal } from "@/components/meetings/CreateMeetingModal";

const FORMATS = [
  {
    icon: <FileText className="size-4" />,
    name: "Plain text (.txt)",
    detail: "[00:01:23] Alice: text · Alice (01:23): text · Alice: text · or a bare speaker header on its own line.",
  },
  {
    icon: <FileText className="size-4" />,
    name: "Subtitles (.vtt / .srt)",
    detail: "Cue timings are used directly. Speakers come from <v Name> or a “Name:” prefix inside the cue.",
  },
  {
    icon: <FileJson className="size-4" />,
    name: "JSON (.json)",
    detail: '{"segments": [{"speaker", "start_ms", "end_ms", "text"}]} — or a bare array. Seconds are accepted too.',
  },
];

export default function UploadsPage() {
  const [open, setOpen] = useState(false);
  const filters = { source: "upload", sort: "recent" as const, page_size: 50 };
  const uploadsQuery = useQuery({
    queryKey: queryKeys.meetings(filters),
    queryFn: () => api.meetings(filters),
  });
  const items = uploadsQuery.data?.items ?? [];

  return (
    <AppShell title="Uploads" sidebar={<ChannelSidebar />}>
      <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-6">
        <h1 className="font-display text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">Uploads</h1>
        <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
          Bring a transcript you already have and it is parsed on arrival, with speakers and timings kept intact.
        </p>

        <div className="ff-surface mt-6 rounded-xl border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Upload a transcript</h2>
              <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
                Speakers, timestamps and AI notes are derived automatically.
              </p>
            </div>
            <Button variant="primary" icon={<Upload className="size-4" />} onClick={() => setOpen(true)}>
              Choose a file
            </Button>
          </div>

          <ul className="mt-5 space-y-3 border-t border-[var(--app-border)] pt-5">
            {FORMATS.map((format) => (
              <li key={format.name} className="flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                  {format.icon}
                </span>
                <div>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{format.name}</p>
                  <p className="mt-0.5 text-sm leading-5 text-gray-500 dark:text-gray-400">{format.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <h2 className="mb-3 mt-8 text-lg font-medium text-gray-900 dark:text-gray-100">Uploaded meetings</h2>
        {items.length === 0 ? (
          <EmptyState
            className="ff-surface rounded-xl border"
            icon={<Upload className="size-5" />}
            title="Nothing uploaded yet"
            description="Transcripts you upload will be listed here."
          />
        ) : (
          <div className="ff-surface divide-y divide-[var(--app-border)] overflow-hidden rounded-xl border">
            {items.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/view/${meeting.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              >
                <FileText className="size-4 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-md font-medium text-gray-900 dark:text-gray-100">{meeting.title}</p>
                  <p className="text-base text-gray-500 dark:text-gray-400">
                    {formatMeetingDate(meeting.meeting_date)} · {meeting.segment_count} lines
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateMeetingModal open={open} onClose={() => setOpen(false)} initialMode="upload" />
    </AppShell>
  );
}
