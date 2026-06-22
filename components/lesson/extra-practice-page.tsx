"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { GuestLessonGuard } from "@/components/guest/guest-lesson-guard";
import { AlcumusPractice } from "@/components/lesson/alcumus-practice";
import { useLessonAssessment } from "@/components/lesson/lesson-assessment-provider";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import { QuestionHistorySection } from "@/components/student/question-history-section";
import { Button } from "@/components/ui/button";
import { useContentStore } from "@/components/admin/content-store-provider";
import { getLessonClient } from "@/lib/student/curriculum-client";
import { lessonPath } from "@/lib/student/paths";
import {
  createInitialAlcumusState,
  masteryPercent,
  masteryStepLabel,
  type AlcumusState,
} from "@/lib/lesson/alcumus-machine";

function alcumusStorageKey(courseId: string, lessonId: string) {
  return `ysg-alcumus-state-${courseId}-${lessonId}`;
}

function loadPersistedState(
  courseId: string,
  lessonId: string,
  pool: { id: string }[],
): AlcumusState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(alcumusStorageKey(courseId, lessonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AlcumusState;
    if (!pool.some((p) => p.id === parsed.problemId)) return null;
    return parsed;
  } catch {
    return null;
  }
}

type ExtraPracticePageProps = {
  courseId: string;
  lessonId: string;
};

export function ExtraPracticePage({ courseId, lessonId }: ExtraPracticePageProps) {
  const { store } = useContentStore();
  const lessonMeta = getLessonClient(store, courseId, lessonId);
  const { practice, ready, error } = useLessonAssessment();
  const [state, setState] = useState<AlcumusState | null>(null);

  useEffect(() => {
    if (ready && practice.length > 0 && !state) {
      setState(
        loadPersistedState(courseId, lessonId, practice) ??
          createInitialAlcumusState(practice),
      );
    }
  }, [ready, practice, state, courseId, lessonId]);

  useEffect(() => {
    if (!state) return;
    sessionStorage.setItem(
      alcumusStorageKey(courseId, lessonId),
      JSON.stringify(state),
    );
  }, [state, courseId, lessonId]);

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

  if (!state) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading extra practice…
      </p>
    );
  }

  const percent = masteryPercent(state);
  const stepLabel = masteryStepLabel(state);

  return (
    <GuestLessonGuard courseId={courseId} lessonId={lessonId}>
    <div className="space-y-8">
      <LessonProgressRail
        percent={percent}
        stepLabel={`Mastery · ${stepLabel}`}
        ariaLabel="Practice mastery progress"
        trailing={
          <Button variant="ghost" asChild size="sm" className="shrink-0 self-end sm:self-center">
            <Link href={lessonPath(courseId, lessonId)}>
              <ArrowLeft aria-hidden />
              Back to lesson
            </Link>
          </Button>
        }
      />

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
          Harder chapter problems and any easy questions not chosen for your
          assignment. Difficulty adapts as you work—like AoPS Alcumus.
        </p>
      </header>

      <AlcumusPractice
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
