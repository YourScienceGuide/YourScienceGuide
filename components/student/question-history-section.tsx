"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useActiveStudent } from "@/components/family/active-student-provider";
import {
  fetchQuestionHistory,
  QUESTION_ATTEMPT_RECORDED_EVENT,
  type QuestionHistoryResponse,
} from "@/lib/student/question-history-client";
import { cn } from "@/lib/utils";

type QuestionHistorySectionProps = {
  courseId?: string;
  lessonId?: string;
  title?: string;
  description?: string;
  className?: string;
};

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function activityLabel(activity: string): string {
  return activity === "alcumus" ? "Extra practice" : "Assignment";
}

export function QuestionHistorySection({
  courseId,
  lessonId,
  title = "Question history",
  description = "A log of questions you have answered and whether you got them right.",
  className,
}: QuestionHistorySectionProps) {
  const { isGuest, isLoggedIn } = useAuth();
  const { activeStudentId } = useActiveStudent();
  const [data, setData] = useState<QuestionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isGuest || !isLoggedIn) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      const result = await fetchQuestionHistory({
        courseId,
        lessonId,
        familyStudentId: activeStudentId ?? undefined,
      });
      setData(result);
      setError(null);
    } catch {
      setError("Could not load question history.");
    } finally {
      setLoading(false);
    }
  }, [activeStudentId, courseId, isGuest, isLoggedIn, lessonId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onUpdate = () => {
      void refresh();
    };
    window.addEventListener(QUESTION_ATTEMPT_RECORDED_EVENT, onUpdate);
    return () => window.removeEventListener(QUESTION_ATTEMPT_RECORDED_EVENT, onUpdate);
  }, [refresh]);

  if (isGuest) {
    return (
      <section
        className={cn(
          "rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400",
          className,
        )}
      >
        Sign in to save and review your question history.
      </section>
    );
  }

  if (loading) {
    return (
      <section className={cn("text-sm text-slate-600 dark:text-stone-400", className)}>
        Loading question history…
      </section>
    );
  }

  if (error) {
    return (
      <section
        className={cn(
          "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200",
          className,
        )}
      >
        {error}
      </section>
    );
  }

  if (data?.source === "unavailable") {
    return (
      <section
        className={cn(
          "rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400",
          className,
        )}
      >
        Question history is unavailable until Supabase is configured for this site.
      </section>
    );
  }

  const summary = data?.summary ?? {
    totalAttempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0,
    accuracyPercent: 0,
  };
  const attempts = data?.attempts ?? [];

  return (
    <section
      className={cn(
        "space-y-4 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900",
        className,
      )}
      aria-labelledby="question-history-heading"
    >
      <div className="space-y-1">
        <h2
          id="question-history-heading"
          className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
        >
          {title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Answered" value={String(summary.totalAttempts)} />
        <Stat label="Correct" value={String(summary.correctAttempts)} />
        <Stat label="Incorrect" value={String(summary.incorrectAttempts)} />
        <Stat label="Accuracy" value={`${summary.accuracyPercent}%`} />
      </div>

      {attempts.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-stone-400">
          No answered questions recorded yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-sky-200 dark:border-stone-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sky-200 bg-sky-50/80 dark:border-stone-700 dark:bg-stone-800/80">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700 dark:text-stone-300">
                  Question
                </th>
                <th className="hidden px-4 py-3 font-medium text-slate-700 sm:table-cell dark:text-stone-300">
                  Type
                </th>
                <th className="px-4 py-3 font-medium text-slate-700 dark:text-stone-300">
                  Result
                </th>
                <th className="hidden px-4 py-3 font-medium text-slate-700 md:table-cell dark:text-stone-300">
                  When
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 bg-white dark:divide-stone-800 dark:bg-stone-900">
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="px-4 py-3 text-slate-800 dark:text-stone-200">
                    <p>{attempt.promptExcerpt || attempt.questionId}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-stone-500">
                      {activityLabel(attempt.activity)}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 sm:table-cell dark:text-stone-400">
                    {attempt.questionType}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        attempt.isCorrect
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
                      )}
                    >
                      {attempt.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell dark:text-stone-400">
                    {formatWhen(attempt.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 dark:border-stone-700 dark:bg-stone-950/40">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-stone-50">
        {value}
      </p>
    </div>
  );
}
