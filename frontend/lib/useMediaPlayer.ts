"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface MediaPlayerState {
  currentMs: number;
  durationMs: number;
  playing: boolean;
  rate: number;
  ready: boolean;
  /** True when there is no real media file and playback is simulated. */
  simulated: boolean;
}

export interface MediaPlayerApi extends MediaPlayerState {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (ms: number) => void;
  skip: (deltaMs: number) => void;
  setRate: (rate: number) => void;
  /** Attach to the <audio>/<video> element when a real file is present. */
  mediaRef: React.RefObject<HTMLMediaElement | null>;
}

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
export const PLAYBACK_RATES = RATES;

/**
 * Drives playback for a meeting.
 *
 * With a `mediaUrl` this is a thin wrapper over an <audio>/<video> element.
 * Without one — which is every seeded meeting, since real recordings are out of
 * scope — it runs a clock over `durationSeconds` at the selected rate. Both
 * modes expose exactly the same API, so the transcript's click-to-seek and
 * follow-along behaviour is real either way and needs no special-casing.
 */
export function useMediaPlayer(durationSeconds: number, mediaUrl?: string | null): MediaPlayerApi {
  const simulated = !mediaUrl;
  const durationMs = Math.max(1000, durationSeconds * 1000);

  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRateState] = useState(1);
  const [ready, setReady] = useState(simulated);

  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Simulated transport: advance a clock on each animation frame.
  useEffect(() => {
    if (!simulated || !playing) return;
    lastTickRef.current = performance.now();

    const step = (now: number) => {
      const delta = (now - lastTickRef.current) * rate;
      lastTickRef.current = now;
      setCurrentMs((current) => {
        const next = current + delta;
        if (next >= durationMs) {
          setPlaying(false);
          return durationMs;
        }
        return next;
      });
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [simulated, playing, rate, durationMs]);

  // Real transport: mirror the element's state into React.
  useEffect(() => {
    const element = mediaRef.current;
    if (simulated || !element) return;

    const onTime = () => setCurrentMs(element.currentTime * 1000);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onReady = () => setReady(true);
    const onEnded = () => setPlaying(false);

    element.addEventListener("timeupdate", onTime);
    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);
    element.addEventListener("loadedmetadata", onReady);
    element.addEventListener("canplay", onReady);
    element.addEventListener("ended", onEnded);
    return () => {
      element.removeEventListener("timeupdate", onTime);
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("loadedmetadata", onReady);
      element.removeEventListener("canplay", onReady);
      element.removeEventListener("ended", onEnded);
    };
  }, [simulated]);

  const play = useCallback(() => {
    if (simulated) {
      setPlaying(true);
      return;
    }
    // A rejected play() (autoplay policy) must not leave the UI showing "playing".
    mediaRef.current?.play().catch(() => setPlaying(false));
  }, [simulated]);

  const pause = useCallback(() => {
    if (simulated) setPlaying(false);
    else mediaRef.current?.pause();
  }, [simulated]);

  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);

  const seek = useCallback(
    (ms: number) => {
      const clamped = Math.min(Math.max(0, ms), durationMs);
      setCurrentMs(clamped);
      if (!simulated && mediaRef.current) mediaRef.current.currentTime = clamped / 1000;
    },
    [durationMs, simulated],
  );

  const skip = useCallback((deltaMs: number) => seek(currentMs + deltaMs), [currentMs, seek]);

  const setRate = useCallback(
    (next: number) => {
      setRateState(next);
      if (!simulated && mediaRef.current) mediaRef.current.playbackRate = next;
    },
    [simulated],
  );

  return useMemo(
    () => ({ currentMs, durationMs, playing, rate, ready, simulated, play, pause, toggle, seek, skip, setRate, mediaRef }),
    [currentMs, durationMs, playing, rate, ready, simulated, play, pause, toggle, seek, skip, setRate],
  );
}
