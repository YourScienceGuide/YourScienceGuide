"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { GuestLessonGuard } from "@/components/guest/guest-lesson-guard";
import { AnkiFlashcardReview } from "@/components/lesson/anki-flashcard-review";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import { useStudentScope } from "@/components/student/use-student-scope";
import { Button } from "@/components/ui/button";
import {
  createInitialDeckState,
  createEmptyDeckState,
  definitionsProgress,
  masteryPercent,
  masteryStepLabel,
  mergeDeckWithCards,
} from "@/lib/lesson/flashcard-machine";
import type { DeckState, Flashcard } from "@/lib/lesson/flashcard-types";
import { useContentStore } from "@/components/admin/content-store-provider";
import { getFlashcardsFromStore } from "@/lib/admin/content-store";
import { getLessonClient } from "@/lib/student/curriculum-client";
import {
  loadFlashcardDefinitions,
  saveFlashcardDefinition,
} from "@/lib/student/flashcard-definitions";
import { lessonPath } from "@/lib/student/paths";
import { shouldPersistStudentData } from "@/lib/student/student-scope";

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
  if (!shouldPersistStudentData(studentScope)) return null;
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
  const adminCards = getFlashcardsFromStore(store, courseId, lessonId);
  const [state, setState] = useState<DeckState | null>(null);

  const lessonCards = useMemo((): Flashcard[] => {
    if (!studentScope) return [];
    const definitions = loadFlashcardDefinitions(studentScope, courseId, lessonId);
    return adminCards.map((card) => ({
      id: card.id,
      front: card.term,
      back: definitions[card.id] ?? "",
    }));
  }, [adminCards, courseId, lessonId, studentScope]);

  useEffect(() => {
    if (!studentScope) return;

    const persisted = loadPersistedState(studentScope, courseId, lessonId);
    if (lessonCards.length === 0) {
      setState(createEmptyDeckState());
      return;
    }

    setState(
      persisted
        ? mergeDeckWithCards(persisted, lessonCards)
        : createInitialDeckState(lessonCards),
    );
  }, [studentScope, courseId, lessonId, lessonCards]);

  useEffect(() => {
    if (
      !state ||
      !studentScope ||
      !shouldPersistStudentData(studentScope) ||
      state.entries.length === 0
    ) {
      return;
    }
    sessionStorage.setItem(
      flashcardStorageKey(studentScope, courseId, lessonId),
      JSON.stringify(state),
    );
  }, [state, studentScope, courseId, lessonId]);

  const onStateChange = useCallback((next: DeckState) => {
    setState(next);
  }, []);

  const onDefinitionSaved = useCallback(
    (cardId: string, definition: string) => {
      if (!studentScope) return;
      saveFlashcardDefinition(studentScope, courseId, lessonId, cardId, definition);
    },
    [courseId, lessonId, studentScope],
  );

  if (!studentScope) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading flashcards…
      </p>
    );
  }

  if (adminCards.length === 0) {
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
              Flashcard Review
            </h1>
            {lessonMeta && (
              <p className="text-sm text-slate-500 dark:text-stone-500">
                {lessonMeta.title}
              </p>
            )}
          </header>
          <p className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400">
            No flashcards have been added for this lesson yet.
          </p>
        </div>
      </GuestLessonGuard>
    );
  }

  if (!state) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading flashcards…
      </p>
    );
  }

  const percent = masteryPercent(state);
  const stepLabel = masteryStepLabel(state);
  const { defined, total } = definitionsProgress(state);

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
          Your teacher added {total} term{total === 1 ? "" : "s"}. Write your own
          definition for each card, then review with spaced repetition.
        </p>
        <p className="text-sm text-slate-500 dark:text-stone-500">
          {defined} of {total} definitions written
        </p>
      </header>

      <AnkiFlashcardReview
        state={state}
        onStateChange={onStateChange}
        onDefinitionSaved={onDefinitionSaved}
      />
    </div>
    </GuestLessonGuard>
  );
}
