"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

export type McPhaseProgressProps = {
  answered: number;
  correct: number;
  total: number;
  targetCorrect: number;
};

export function remainingCorrectNeeded(
  correct: number,
  targetCorrect: number,
): number {
  return Math.max(0, targetCorrect - correct);
}

export function McPhaseProgress({
  answered,
  correct,
  total,
  targetCorrect,
}: McPhaseProgressProps) {
  const [showRemaining, setShowRemaining] = useState(false);
  const toggleId = useId();
  const remaining = remainingCorrectNeeded(correct, targetCorrect);
  const answeredPct =
    total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0;
  const correctPct =
    targetCorrect > 0
      ? Math.min(100, Math.round((correct / targetCorrect) * 100))
      : 0;
  const currentQuestion = Math.min(answered + 1, total);

  return (
    <div className="space-y-4 rounded-lg border border-sky-200 bg-sky-50/50 p-4 dark:border-stone-700 dark:bg-stone-900/60">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sky-700 dark:text-stone-400">
            Your progress
          </p>
          <p className="mt-1 text-sm text-slate-700 dark:text-stone-300">
            Question{" "}
            <span className="font-semibold tabular-nums text-slate-900 dark:text-stone-50">
              {currentQuestion}
            </span>{" "}
            of{" "}
            <span className="font-semibold tabular-nums text-slate-900 dark:text-stone-50">
              {total}
            </span>
          </p>
        </div>
        <p className="text-sm tabular-nums text-slate-600 dark:text-stone-400">
          <span className="font-semibold text-slate-900 dark:text-stone-50">
            {answered}
          </span>{" "}
          answered ·{" "}
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
            {correct}
          </span>{" "}
          correct
        </p>
      </div>

      <div className="space-y-3">
        <ProgressMeter
          label="Questions answered"
          valueLabel={`${answered} / ${total}`}
          percent={answeredPct}
          barClassName="bg-sky-600 dark:bg-sky-400"
        />
        <ProgressMeter
          label="Correct answers"
          valueLabel={`${correct} / ${targetCorrect} to finish`}
          percent={correctPct}
          barClassName="bg-emerald-600 dark:bg-emerald-400"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-100 pt-3 dark:border-stone-800">
        <label
          htmlFor={toggleId}
          className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-stone-300"
        >
          <span
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
              showRemaining
                ? "bg-sky-600 dark:bg-stone-200"
                : "bg-sky-200 dark:bg-stone-700",
            )}
          >
            <input
              id={toggleId}
              type="checkbox"
              role="switch"
              checked={showRemaining}
              onChange={(e) => setShowRemaining(e.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "inline-block size-4 translate-x-0.5 rounded-full bg-white shadow transition-transform dark:bg-stone-900",
                showRemaining && "translate-x-4 dark:bg-stone-800",
              )}
            />
          </span>
          Show how many more I need
        </label>
      </div>

      {showRemaining ? (
        <p
          role="status"
          className="rounded-md bg-white/80 px-3 py-2 text-sm text-slate-700 dark:bg-stone-950/50 dark:text-stone-300"
        >
          {remaining === 0 ? (
            <>You have enough correct answers to finish this section.</>
          ) : (
            <>
              Get{" "}
              <span className="font-semibold tabular-nums text-slate-900 dark:text-stone-50">
                {remaining}
              </span>{" "}
              more correct to finish early
              {answered < total ? (
                <>
                  {" "}
                  (or keep going — you can try all{" "}
                  <span className="tabular-nums">{total}</span> questions).
                </>
              ) : (
                "."
              )}
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}

function ProgressMeter({
  label,
  valueLabel,
  percent,
  barClassName,
}: {
  label: string;
  valueLabel: string;
  percent: number;
  barClassName: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-600 dark:text-stone-400">
          {label}
        </span>
        <span className="tabular-nums text-slate-500 dark:text-stone-500">
          {valueLabel}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-sky-100 dark:bg-stone-800"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            barClassName,
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
