"use client";

import MuxPlayer from "@mux/mux-player-react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CONTENT_UPDATED_EVENT, getVideoFromStore, loadContentStore } from "@/lib/admin/content-store";
import { cn } from "@/lib/utils";

const MOCK_VIDEO = {
  title: "Introduction: Cells & Photosynthesis",
  description:
    "Watch how plant cells capture light and turn it into food before you practice.",
};

const MOCK_DURATION_SEC = 8 * 60 + 42;
const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

type LessonVideoProps = {
  courseId: string;
  lessonId: string;
};

export function LessonVideo({ courseId, lessonId }: LessonVideoProps) {
  const [meta, setMeta] = useState(() =>
    getVideoFromStore(loadContentStore(), courseId, lessonId),
  );

  useEffect(() => {
    const refresh = () => {
      setMeta(getVideoFromStore(loadContentStore(), courseId, lessonId));
    };
    refresh();
    window.addEventListener(CONTENT_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CONTENT_UPDATED_EVENT, refresh);
  }, [courseId, lessonId]);

  const title = meta?.title ?? MOCK_VIDEO.title;
  const description = meta?.description ?? MOCK_VIDEO.description;
  const hasUpload = Boolean(meta?.muxPlaybackId || meta?.sourceUrl);

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Lesson video
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          {hasUpload
            ? "Uploaded lesson video from your instructor."
            : "Start with a short overview, then practice below."}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-sky-200 bg-white dark:border-stone-700 dark:bg-stone-900">
        {meta?.muxPlaybackId ? (
          <MuxPlayer
            playbackId={meta.muxPlaybackId}
            className="aspect-video w-full bg-stone-950"
          />
        ) : hasUpload && meta?.sourceUrl ? (
          <video
            src={meta.sourceUrl}
            controls
            className="aspect-video w-full bg-stone-950"
            playsInline
          >
            <track kind="captions" />
          </video>
        ) : (
          <MockVideoPlayer />
        )}

        <div className="space-y-1 border-t border-sky-100 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
          <h3 className="font-medium text-slate-900 dark:text-stone-50">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-stone-400">{description}</p>
          {meta?.fileName && (
            <p className="text-xs text-slate-500 dark:text-stone-500">
              File: {meta.fileName}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function MockVideoPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const atEnd = currentTime >= MOCK_DURATION_SEC;

  useEffect(() => {
    if (!playing || atEnd) return;

    const timer = window.setInterval(() => {
      setCurrentTime((t) => {
        const next = Math.min(MOCK_DURATION_SEC, t + playbackRate);
        if (next >= MOCK_DURATION_SEC) setPlaying(false);
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [playing, playbackRate, atEnd]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const togglePlay = useCallback(() => {
    if (atEnd) {
      setCurrentTime(0);
      setPlaying(true);
      setHasStarted(true);
      return;
    }
    setPlaying((p) => !p);
    setHasStarted(true);
  }, [atEnd]);

  const seekBy = useCallback((delta: number) => {
    setCurrentTime((t) => Math.min(MOCK_DURATION_SEC, Math.max(0, t + delta)));
    setHasStarted(true);
  }, []);

  const seekTo = useCallback((time: number) => {
    setCurrentTime(Math.min(MOCK_DURATION_SEC, Math.max(0, time)));
    setHasStarted(true);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      /* Fullscreen may be unavailable */
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-stone-950",
        isFullscreen && "h-screen w-screen justify-center",
      )}
    >
      <div
        className={cn(
          "relative aspect-video w-full bg-gradient-to-br from-sky-900 via-sky-800 to-slate-900",
          isFullscreen && "aspect-auto min-h-0 flex-1",
        )}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {hasStarted ? (
            <>
              <p className="text-sm font-medium text-sky-100">Mock lesson video</p>
              <p className="mt-1 max-w-md text-xs text-sky-200/80">
                Preview playback — upload a video in Admin to replace this.
              </p>
            </>
          ) : (
            <p className="text-sm text-sky-100/90">Press play to start the lesson video</p>
          )}
        </div>

        {!playing && !atEnd && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
            aria-label="Play video"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-white text-sky-800 shadow-lg">
              <Play className="ml-1 size-8" aria-hidden />
            </span>
          </button>
        )}

        {atEnd && !playing && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/25"
            aria-label="Replay video"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-white text-sky-800">
              <RotateCcw className="size-6" aria-hidden />
            </span>
            <span className="text-sm font-medium text-white">Replay</span>
          </button>
        )}
      </div>

      <VideoControls
        playing={playing}
        currentTime={currentTime}
        duration={MOCK_DURATION_SEC}
        playbackRate={playbackRate}
        isFullscreen={isFullscreen}
        onTogglePlay={togglePlay}
        onSeekBy={seekBy}
        onSeekTo={seekTo}
        onPlaybackRateChange={setPlaybackRate}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}

type VideoControlsProps = {
  playing: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onSeekBy: (delta: number) => void;
  onSeekTo: (time: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleFullscreen: () => void;
};

function VideoControls({
  playing,
  currentTime,
  duration,
  playbackRate,
  isFullscreen,
  onTogglePlay,
  onSeekBy,
  onSeekTo,
  onPlaybackRateChange,
  onToggleFullscreen,
}: VideoControlsProps) {
  return (
    <div className="border-t border-stone-800 bg-stone-900 px-3 py-2 text-white">
      <label className="sr-only" htmlFor="video-seek">
        Seek video
      </label>
      <input
        id="video-seek"
        type="range"
        min={0}
        max={duration}
        step={1}
        value={currentTime}
        onChange={(e) => onSeekTo(Number(e.target.value))}
        className="mb-2 h-1.5 w-full cursor-pointer accent-sky-400"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
      />

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onTogglePlay}
          className="rounded p-1.5 hover:bg-stone-800"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <button
          type="button"
          onClick={() => onSeekBy(-10)}
          className="rounded p-1.5 hover:bg-stone-800"
          aria-label="Rewind 10 seconds"
        >
          <RotateCcw className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => onSeekBy(10)}
          className="rounded p-1.5 hover:bg-stone-800"
          aria-label="Forward 10 seconds"
        >
          <RotateCw className="size-5" />
        </button>
        <span className="min-w-[7.5rem] tabular-nums text-xs text-stone-300">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div className="flex-1" />
        <select
          value={playbackRate}
          onChange={(e) => onPlaybackRateChange(Number(e.target.value))}
          className="rounded border border-stone-700 bg-stone-800 px-2 py-1 text-xs text-white"
          aria-label="Playback speed"
        >
          {PLAYBACK_SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="rounded p-1.5 hover:bg-stone-800"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="size-5" />
          ) : (
            <Maximize className="size-5" />
          )}
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
