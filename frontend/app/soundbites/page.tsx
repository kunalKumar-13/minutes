"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Play, Scissors } from "lucide-react";
import { api, queryKeys } from "@/lib/api";
import { formatRelative, formatTimestamp } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { ChannelSidebar } from "@/components/layout/ChannelSidebar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SoundbitesPage() {
  const soundbitesQuery = useQuery({ queryKey: queryKeys.soundbites, queryFn: api.soundbites });
  const items = soundbitesQuery.data ?? [];

  return (
    <AppShell title="Soundbites" sidebar={<ChannelSidebar />}>
      <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-6">
        <h1 className="font-display text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
          Soundbites
        </h1>
        <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
          Moments you clipped out of a recording, with the transcript that goes with them.
        </p>

        <div className="mt-6">
          {soundbitesQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              className="ff-surface rounded-xl border"
              icon={<Scissors className="size-5" />}
              title="No soundbites yet"
              description="Open a meeting and clip a line from the transcript, or use the scissors in the player."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((soundbite) => (
                <Link
                  key={soundbite.id}
                  href={`/view/${soundbite.meeting_id}`}
                  className="ff-surface group flex flex-col rounded-xl border p-4 transition-shadow hover:shadow-e3"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-500/15 dark:text-purple-300">
                      <Play className="ml-0.5 size-4 fill-current" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-md font-medium leading-6 text-gray-900 dark:text-gray-100">
                        {soundbite.title}
                      </p>
                      <p className="mt-0.5 text-sm tabular-nums text-blue-700 dark:text-blue-400">
                        {formatTimestamp(soundbite.start_ms)} – {formatTimestamp(soundbite.end_ms)}
                      </p>
                    </div>
                  </div>

                  {soundbite.transcript_excerpt && (
                    <p className="mt-3 line-clamp-3 text-base leading-6 text-gray-600 dark:text-gray-400">
                      “{soundbite.transcript_excerpt}”
                    </p>
                  )}

                  <p className="mt-3 border-t border-[var(--app-border)] pt-3 text-sm text-gray-500 dark:text-gray-400">
                    {soundbite.meeting_title} · {formatRelative(soundbite.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
