"use client";

import { useState } from "react";

const MOCK_VIDEO = {
  title: "Introduction: Cells & Photosynthesis",
  duration: "8:42",
  description:
    "Watch how plant cells capture light and turn it into food before you practice.",
};

export function LessonVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Lesson video
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Start with a short overview, then practice below.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-sky-200 bg-white dark:border-stone-700 dark:bg-stone-900">
        <div className="relative aspect-video bg-gradient-to-br from-sky-100 via-sky-50 to-white dark:from-stone-800 dark:via-stone-900 dark:to-stone-950">
          {!playing ? (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-sky-900/5 dark:hover:bg-stone-950/20"
              aria-label="Play lesson video"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg dark:bg-stone-200 dark:text-stone-900">
                <PlayIcon />
              </span>
              <span className="text-sm font-medium text-slate-700 dark:text-stone-300">
                Play lesson video
              </span>
            </button>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-sm font-medium text-sky-800 dark:text-stone-200">
                Mock playback
              </p>
              <p className="max-w-sm text-xs text-slate-600 dark:text-stone-400">
                Video streaming is not connected yet. This preview stands in for
                your lesson recording.
              </p>
              <button
                type="button"
                onClick={() => setPlaying(false)}
                className="mt-2 text-xs font-medium text-sky-700 underline dark:text-stone-300"
              >
                Reset preview
              </button>
            </div>
          )}
          <span className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {MOCK_VIDEO.duration}
          </span>
        </div>
        <div className="space-y-1 border-t border-sky-100 px-4 py-3 dark:border-stone-800">
          <h3 className="font-medium text-slate-900 dark:text-stone-50">
            {MOCK_VIDEO.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            {MOCK_VIDEO.description}
          </p>
        </div>
      </div>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="ml-1 size-7"
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
