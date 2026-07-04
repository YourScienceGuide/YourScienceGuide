"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { GuestLessonGuard } from "@/components/guest/guest-lesson-guard";
import { AlcumusPractice } from "@/components/lesson/alcumus-practice";
import { useLessonAssessment } from "@/components/lesson/lesson-assessment-provider";
import { useStudentScope } from "@/components/student/use-student-scope";
import { QuestionHistorySection } from "@/components/student/question-history-section";
import { Button } from "@/components/ui/button";
import { useContentStore } from "@/components/admin/content-store-provider";
import { getLessonClient } from "@/lib/student/curriculum-client";
import { lessonPath } from "@/lib/student/paths";
import { shouldPersistStudentData } from "@/lib/student/student-scope";
import {
  normalizeAlcumusState,
  practicePercent,
  practiceStepLabel,
  type AlcumusState,
} from "@/lib/lesson/alcumus-machine";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import { cn } from "@/lib/utils";

function alcumusStorageKey(studentScope: string, courseId: string, lessonId: string) {
  return `ysg-alcumus-state-${studentScope}-${courseId}-${lessonId}`;
}

function sessionSeed(studentScope: string, courseId: string, lessonId: string) {
  return `${studentScope}/${courseId}/${lessonId}/extra-practice`;
}

function loadPersistedState(
  studentScope: string,
  courseId: string,
  lessonId: string,
  pool: ChapterQuestion[],
): AlcumusState | null {
  if (!shouldPersistStudentData(studentScope)) return null;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(alcumusStorageKey(studentScope, courseId, lessonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AlcumusState>;
    return normalizeAlcumusState(
      parsed,
      pool,
      sessionSeed(studentScope, courseId, lessonId),
    );
  } catch {
    return null;
  }
}

function ExtraPracticeProgress({
  percent,
  stepLabel,
}: {
  percent: number;
  stepLabel: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/70 p-5 dark:border-stone-700 dark:bg-stone-900/80">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-wide text-sky-700 dark:text-stone-400">
            Extra practice progress
          </p>
          <p className="text-xl font-semibold text-slate-900 dark:text-stone-50">
            {stepLabel}
          </p>
        </div>
        <p className="text-3xl font-semibold tabular-nums text-sky-700 dark:text-stone-200">
          {clamped}%
        </p>
      </div>
      <div
        className="h-4 w-full overflow-hidden rounded-full bg-sky-100 dark:bg-stone-800"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Extra practice progress"
      >
        <div
          className={cn(
            "h-full rounded-full bg-sky-600 transition-all duration-300",
            "dark:bg-stone-200",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

type ExtraPracticePageProps = {
  courseId: string;
  lessonId: string;
};

export function ExtraPracticePage({ courseId, lessonId }: ExtraPracticePageProps) {
  const { store } = useContentStore();
  const studentScope = useStudentScope();
  const lessonMeta = getLessonClient(store, courseId, lessonId);
  const { practice, ready, error } = useLessonAssessment();
  const [state, setState] = useState<AlcumusState | null>(null);

  useEffect(() => {
    if (ready && practice.length > 0 && !state && studentScope) {
      setState(
        loadPersistedState(studentScope, courseId, lessonId, practice) ??
          normalizeAlcumusState(
            null,
            practice,
            sessionSeed(studentScope, courseId, lessonId),
          ),
      );
    }
  }, [ready, practice, state, studentScope, courseId, lessonId]);

  useEffect(() => {
    if (!state || !studentScope || !shouldPersistStudentData(studentScope)) return;
    sessionStorage.setItem(
      alcumusStorageKey(studentScope, courseId, lessonId),
      JSON.stringify(state),
    );
  }, [state, studentScope, courseId, lessonId]);

  const onStateChange = useCallback((next: AlcumusState) => {
    setState(next);
  }, []);

  if (error) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  if (!ready) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading extra practice…
      </p>
    );
  }

  if (practice.length === 0) {
    return (
      <GuestLessonGuard courseId={courseId} lessonId={lessonId}>
        <div className="space-y-6">
          <Button variant="ghost" asChild size="sm">
            <Link href={lessonPath(courseId, lessonId)}>
              <ArrowLeft aria-hidden />
              Back to lesson
            </Link>
          </Button>
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
              Extra Practice
            </h1>
            {lessonMeta && (
              <p className="text-sm text-slate-500 dark:text-stone-500">
                {lessonMeta.title}
              </p>
            )}
          </header>
          <p className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400">
            No extra practice problems for this section.
          </p>
        </div>
      </GuestLessonGuard>
    );
  }

  if (!state || !studentScope) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading extra practice…
      </p>
    );
  }

  const percent = practicePercent(state);
  const stepLabel = practiceStepLabel(state);

  return (
    <GuestLessonGuard courseId={courseId} lessonId={lessonId}>
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild size="sm" className="shrink-0">
          <Link href={lessonPath(courseId, lessonId)}>
            <ArrowLeft aria-hidden />
            Back to lesson
          </Link>
        </Button>
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Extra Practice
        </h1>
        {lessonMeta && (
          <p className="text-sm text-slate-500 dark:text-stone-500">
            {lessonMeta.title}
          </p>
        )}
        <p className="text-base text-slate-600 dark:text-stone-400">
          Work through five harder chapter problems. Answer each one correctly to
          move on.
        </p>
      </header>

      <ExtraPracticeProgress percent={percent} stepLabel={stepLabel} />

      <AlcumusPractice
        studentScope={studentScope}
        courseId={courseId}
        lessonId={lessonId}
        state={state}
        onStateChange={onStateChange}
      />

      <QuestionHistorySection
        courseId={courseId}
        lessonId={lessonId}
        title="Your question history"
        description="Extra practice and assignment attempts for this lesson."
      />
    </div>
    </GuestLessonGuard>
  );
}
