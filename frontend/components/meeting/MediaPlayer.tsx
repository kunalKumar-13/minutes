"use client";

import { useMemo, useRef } from "react";
import {
  Gauge, Mic, Pause, Play, RotateCcw, RotateCw, Scissors, Video, Volume2,
} from "lucide-react";
import type { MediaPlayerApi } from "@/lib/useMediaPlayer";
import { PLAYBACK_RATES } from "@/lib/useMediaPlayer";
import { cn, formatTimestamp } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";

/**
 * A stable pseudo-waveform for a meeting.
 *
 * There is no audio to analyse, so the bars are derived from the meeting id.
 * Being a pure function of the id means the same meeting always draws the same
 * waveform — it reads as a real recording rather than as noise that reshuffles
 * on every render.
 */
function waveformFor(seed: string, bars: number): number[] {
  let state = 0;
  for (let i = 0; i < seed.length; i += 1) state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: bars }, (_, index) => {
    state = (state * 1664525 + 1013904223) >>> 0;
    const noise = (state % 1000) / 1000;
    // A slow sine keeps the envelope looking like speech rather than static.
    const envelope = 0.55 + 0.45 * Math.sin((index / bars) * Math.PI * 6);
    return Math.max(0.18, Math.min(1, noise * 0.65 + envelope * 0.45));
  });
}

export interface MediaPlayerProps {
  player: MediaPlayerApi;
  mediaUrl?: string | null;
  mediaType: string;
  meetingId: string;
  title: string;
  onCreateSoundbite?: () => void;
  className?: string;
}

export function MediaPlayer({
  player, mediaUrl, mediaType, meetingId, title, onCreateSoundbite, className,
}: MediaPlayerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const BARS = 128;
  const bars = useMemo(() => waveformFor(meetingId, BARS), [meetingId]);
  const progress = player.durationMs > 0 ? player.currentMs / player.durationMs : 0;

  const seekFromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    player.seek(ratio * player.durationMs);
  };

  const MediaIcon = mediaType === "video" ? Video : Mic;

  return (
    <div className={cn("ff-surface border-t px-3 py-2.5 sm:px-4", className)}>
      {mediaUrl &&
        (mediaType === "video" ? (
          <video
            ref={player.mediaRef as React.RefObject<HTMLVideoElement>}
            src={mediaUrl}
            className="hidden"
            preload="metadata"
          />
        ) : (
          <audio
            ref={player.mediaRef as React.RefObject<HTMLAudioElement>}
            src={mediaUrl}
            className="hidden"
            preload="metadata"
          />
        ))}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={player.toggle}
          aria-label={player.playing ? "Pause" : "Play"}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white shadow-e2 transition-colors hover:bg-purple-700 active:bg-purple-800"
        >
          {player.playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
        </button>

        <div className="hidden items-center gap-0.5 sm:flex">
          <IconButton label="Back 15 seconds" size="sm" onClick={() => player.skip(-15_000)}>
            <RotateCcw className="size-4" />
          </IconButton>
          <IconButton label="Forward 15 seconds" size="sm" onClick={() => player.skip(15_000)}>
            <RotateCw className="size-4" />
          </IconButton>
        </div>

        <span className="w-11 shrink-0 text-right text-sm tabular-nums text-gray-500 dark:text-gray-400">
          {formatTimestamp(player.currentMs)}
        </span>

        {/*
          The bars are decorative; the slider under them is the real control and
          carries the keyboard interaction and the a11y semantics.
        */}
        <div
          ref={trackRef}
          className="group relative min-w-0 flex-1 cursor-pointer py-2"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            seekFromPointer(event.clientX);
          }}
          onPointerMove={(event) => {
            if (event.buttons === 1) seekFromPointer(event.clientX);
          }}
        >
          <div className="flex h-8 items-center gap-[2px]" aria-hidden>
            {bars.map((height, index) => {
              const played = index / BARS <= progress;
              return (
                <span
                  key={index}
                  style={{ height: `${height * 100}%` }}
                  className={cn(
                    "min-h-[3px] flex-1 rounded-full transition-colors",
                    played
                      ? "bg-purple-500"
                      : "bg-gray-200 group-hover:bg-gray-300 dark:bg-ink-400 dark:group-hover:bg-ink-300",
                  )}
                />
              );
            })}
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

        <span className="w-11 shrink-0 text-sm tabular-nums text-gray-500 dark:text-gray-400">
          {formatTimestamp(player.durationMs)}
        </span>

        <div className="flex shrink-0 items-center gap-0.5">
          {onCreateSoundbite && (
            <IconButton label="Create a soundbite from here" size="sm" onClick={onCreateSoundbite}>
              <Scissors className="size-4" />
            </IconButton>
          )}

          <Dropdown
            align="end"
            trigger={
              <button
                type="button"
                aria-label="Playback speed"
                className="inline-flex h-7 items-center gap-1 rounded px-1.5 text-sm font-medium tabular-nums text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5"
              >
                <Gauge className="size-3.5" />
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

          <span
            title={
              player.simulated
                ? "No recording is attached — playback is simulated against the transcript timeline."
                : `${mediaType === "video" ? "Video" : "Audio"} recording attached`
            }
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-2 py-0.5 text-2xs font-medium md:inline-flex",
              player.simulated
                ? "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                : "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
            )}
          >
            {player.simulated ? <Volume2 className="size-3" /> : <MediaIcon className="size-3" />}
            {player.simulated ? "Simulated" : mediaType === "video" ? "Video" : "Audio"}
          </span>
        </div>
      </div>
    </div>
  );
}
