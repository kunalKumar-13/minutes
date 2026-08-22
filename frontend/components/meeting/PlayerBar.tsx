"use client";

import { useRef } from "react";
import {
  ChevronDown, Download, Pause, Play, RotateCcw, RotateCw, Scissors,
  Star, ThumbsDown, ThumbsUp,
} from "lucide-react";
import type { MediaPlayerApi } from "@/lib/useMediaPlayer";
import { PLAYBACK_RATES } from "@/lib/useMediaPlayer";
import { cn, formatTimestamp } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";

export interface PlayerBarProps {
  player: MediaPlayerApi;
  mediaUrl?: string | null;
  mediaType: string;
  title: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onCreateSoundbite: () => void;
  onDownload: () => void;
  onRate: (positive: boolean) => void;
}

/**
 * The bar across the bottom of the meeting view: elapsed/total on the left,
 * transport centred, per-meeting actions on the right.
 *
 * The scrubber is a hairline that thickens on hover rather than a permanent
 * waveform — the real product keeps this bar visually quiet so the transcript
 * and notes hold attention.
 */
export function PlayerBar({
  player, mediaUrl, mediaType, title, isFavorite,
  onToggleFavorite, onCreateSoundbite, onDownload, onRate,
}: PlayerBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const progress = player.durationMs > 0 ? player.currentMs / player.durationMs : 0;

  const seekFromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    player.seek(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * player.durationMs);
  };

  return (
    <div className="relative shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface)]">
      {mediaUrl &&
        (mediaType === "video" ? (
          <video ref={player.mediaRef as React.RefObject<HTMLVideoElement>} src={mediaUrl} className="hidden" preload="metadata" />
        ) : (
          <audio ref={player.mediaRef as React.RefObject<HTMLAudioElement>} src={mediaUrl} className="hidden" preload="metadata" />
        ))}

      {/* Scrubber sits on the top edge of the bar, full bleed. */}
      <div
        ref={trackRef}
        className="group absolute inset-x-0 -top-1 z-10 h-3 cursor-pointer"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          seekFromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.buttons === 1) seekFromPointer(event.clientX);
        }}
      >
        <div className="absolute inset-x-0 top-1 h-1 bg-gray-200 transition-all group-hover:h-1.5 dark:bg-white/10">
          <div className="h-full bg-purple-500" style={{ width: `${progress * 100}%` }}>
            <span className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full bg-purple-600 opacity-0 shadow transition-opacity group-hover:opacity-100" />
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={player.durationMs}
          step={1000}
          value={Math.round(player.currentMs)}
          onChange={(event) => player.seek(Number(event.target.value))}
          aria-label={`Seek within ${title}`}
          aria-valuetext={`${formatTimestamp(player.currentMs)} of ${formatTimestamp(player.durationMs)}`}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </div>

      <div className="flex h-14 items-center gap-3 px-4">
        <div className="flex w-52 shrink-0 items-center gap-1.5">
          <span className="text-base tabular-nums text-gray-700 dark:text-gray-300">
            {formatTimestamp(player.currentMs)}
          </span>
          <span className="text-base tabular-nums text-gray-400">/ {formatTimestamp(player.durationMs)}</span>
          <Dropdown
            align="start"
            trigger={
              <button
                type="button"
                aria-label="Playback speed"
                className="rounded-sm p-1 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
              >
                <ChevronDown className="size-4" />
              </button>
            }
            items={PLAYBACK_RATES.map((rate) => ({
              key: String(rate),
              label: `${rate}×`,
              selected: player.rate === rate,
              onSelect: () => player.setRate(rate),
            }))}
          />
          <span
            title={
              player.simulated
                ? "No recording attached — playback runs against the transcript timeline."
                : "Recording attached"
            }
            className={cn(
              "ml-1 hidden rounded-sm px-1.5 py-0.5 text-2xs font-medium 2xl:inline-block",
              player.simulated
                ? "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                : "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
            )}
          >
            {player.simulated ? "Simulated" : "Live"}
          </span>
        </div>

        <div className="mx-auto flex items-center gap-4">
          <Dropdown
            align="start"
            trigger={
              <button
                type="button"
                aria-label="Playback speed"
                className="min-w-8 rounded-sm px-1 text-base tabular-nums text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {player.rate}×
              </button>
            }
            items={PLAYBACK_RATES.map((rate) => ({
              key: String(rate),
              label: `${rate}×`,
              selected: player.rate === rate,
              onSelect: () => player.setRate(rate),
            }))}
          />

          <IconButton label="Back 10 seconds" onClick={() => player.skip(-10_000)}>
            <RotateCcw className="size-[18px]" />
          </IconButton>

          <button
            type="button"
            onClick={player.toggle}
            aria-label={player.playing ? "Pause" : "Play"}
            className="flex size-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-e2 transition-colors hover:bg-purple-700 active:bg-purple-800"
          >
            {player.playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
          </button>

          <IconButton label="Forward 10 seconds" onClick={() => player.skip(10_000)}>
            <RotateCw className="size-[18px]" />
          </IconButton>

          <IconButton label="Download transcript" onClick={onDownload}>
            <Download className="size-[18px]" />
          </IconButton>
        </div>

        <div className="flex w-52 shrink-0 items-center justify-end gap-1">
          <IconButton label="Clip a soundbite from here" onClick={onCreateSoundbite}>
            <Scissors className="size-[18px]" />
          </IconButton>
          <IconButton
            label={isFavorite ? "Remove from favourites" : "Add to favourites"}
            onClick={onToggleFavorite}
          >
            <Star className={cn("size-[18px]", isFavorite && "fill-yellow-400 text-yellow-400")} />
          </IconButton>
          <IconButton label="These notes were useful" onClick={() => onRate(true)}>
            <ThumbsUp className="size-[18px]" />
          </IconButton>
          <IconButton label="These notes missed the point" onClick={() => onRate(false)}>
            <ThumbsDown className="size-[18px]" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
