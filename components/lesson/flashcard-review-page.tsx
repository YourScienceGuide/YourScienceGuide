"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { GuestLessonGuard } from "@/components/guest/guest-lesson-guard";
import { AnkiFlashcardReview } from "@/components/lesson/anki-flashcard-review";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import { useStudentScope } from "@/components/student/use-student-scope";
import { Button } from "@/components/ui/button";
import {
  createInitialDeckState,
  masteryPercent,
  masteryStepLabel,
} from "@/lib/lesson/flashcard-machine";
import type { DeckState } from "@/lib/lesson/flashcard-types";
import { useContentStore } from "@/components/admin/content-store-provider";
import { getLessonClient } from "@/lib/student/curriculum-client";
import { lessonPath } from "@/lib/student/paths";

function flashcardStorageKey(
  studentScope: string,
  courseId: string,
  lessonId: string,
) {
  return `ysg-flashcard-deck-state-${studentScope}-${courseId}-${lessonId}`;
}

function loadPersistedState(
  studentScope: string,
  courseId: string,
  lessonId: string,
): DeckState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(
      flashcardStorageKey(studentScope, courseId, lessonId),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeckState;
    if (!parsed.entries?.length || !parsed.currentCardId) return null;
    return parsed;
  } catch {
    return null;
  }
}

type FlashcardReviewPageProps = {
  courseId: string;
  lessonId: string;
};

export function FlashcardReviewPage({
  courseId,
  lessonId,
}: FlashcardReviewPageProps) {
  const { store } = useContentStore();
  const studentScope = useStudentScope();
  const lessonMeta = getLessonClient(store, courseId, lessonId);
  const [state, setState] = useState<DeckState | null>(null);

  useEffect(() => {
    if (!state && studentScope) {
      setState(
        loadPersistedState(studentScope, courseId, lessonId) ??
          createInitialDeckState(),
      );
    }
  }, [state, studentScope, courseId, lessonId]);

  useEffect(() => {
    if (!state || !studentScope) return;
    sessionStorage.setItem(
      flashcardStorageKey(studentScope, courseId, lessonId),
      JSON.stringify(state),
    );
  }, [state, studentScope, courseId, lessonId]);

  const onStateChange = useCallback((next: DeckState) => {
    setState(next);
  }, []);

  if (!state || !studentScope) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading flashcards…
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
        ariaLabel="Flashcard deck mastery progress"
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
          Flashcard Review
        </h1>
        {lessonMeta && (
          <p className="text-sm text-slate-500 dark:text-stone-500">
            {lessonMeta.title}
          </p>
        )}
        <p className="text-base text-slate-600 dark:text-stone-400">
          Study with an Anki-style deck—show the answer, then rate how well you
          remembered. Progress is separate from your lesson assignment.
        </p>
      </header>

      <AnkiFlashcardReview state={state} onStateChange={onStateChange} />
    </div>
    </GuestLessonGuard>
  );
}
