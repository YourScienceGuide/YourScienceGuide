"use client";

import type { ReactNode } from "react";

import {
  letterGradeFromPercent,
  rubricLineItems,
  type GradingRubricConfig,
  type RubricLineItem,
} from "@/lib/lesson/lesson-grade-config";

type GradingRubricSummaryProps = {
  config: GradingRubricConfig;
  graduationThreshold?: number;
  compact?: boolean;
};

export function GradingRubricSummary({
  config,
  graduationThreshold,
  compact = false,
}: GradingRubricSummaryProps) {
  const items = rubricLineItems(config);
  const maxScore = items.reduce((sum, item) => sum + item.maxPoints, 0);

  return (
    <div className="space-y-3 rounded-lg border border-sky-200 bg-sky-50/40 p-4 dark:border-stone-700 dark:bg-stone-950">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-stone-50">
          Lesson grade rubric
        </h3>
        <p className="text-sm tabular-nums text-slate-600 dark:text-stone-400">
          {maxScore} points total
        </p>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <RubricRow key={item.id} item={item} compact={compact} />
        ))}
      </ul>

      {graduationThreshold != null && (
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Graduate this section after solving{" "}
          <strong className="font-medium text-slate-800 dark:text-stone-200">
            {graduationThreshold}
          </strong>{" "}
          problems correctly (multiple choice, fill-in-the-blank, and extra practice).
        </p>
      )}
    </div>
  );
}

function RubricRow({ item, compact }: { item: RubricLineItem; compact: boolean }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 text-sm">
      <div>
        <p className="font-medium text-slate-800 dark:text-stone-200">
          {item.label}
          {item.parentGraded ? (
            <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-300">
              Parent graded
            </span>
          ) : null}
        </p>
        {!compact && (
          <p className="text-xs text-slate-500 dark:text-stone-500">{item.description}</p>
        )}
      </div>
      <p className="shrink-0 tabular-nums text-slate-600 dark:text-stone-400">
        {item.count} × {item.pointsEach} pt = {item.maxPoints}
      </p>
    </li>
  );
}

export function formatGradeLabel(percent: number): string {
  return `${letterGradeFromPercent(percent)} (${percent}%)`;
}
