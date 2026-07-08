"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { GuestLessonGuard } from "@/components/guest/guest-lesson-guard";
import { AnkiFlashcardReview } from "@/components/lesson/anki-flashcard-review";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import { useActiveStudent } from "@/components/family/active-student-provider";
import { useStudentScope } from "@/components/student/use-student-scope";
import { Button } from "@/components/ui/button";
import {
  createInitialDeckState,
  definitionsProgress,
  masteryPercent,
  masteryStepLabel,
  mergeDeckWithCards,
} from "@/lib/lesson/flashcard-machine";
import type { DeckState, Flashcard } from "@/lib/lesson/flashcard-types";
import { useContentStore } from "@/components/admin/content-store-provider";
import { lessonKey } from "@/lib/admin/lesson-key";
import { getFlashcardsFromStore } from "@/lib/admin/content-store";
import { getLessonClient } from "@/lib/student/curriculum-client";
import {
  loadFlashcardDefinitions,
  saveFlashcardDefinition,
} from "@/lib/student/flashcard-definitions";
import {
  recordFlashcardStudyEventClient,
  saveFlashcardDefinitionClient,
} from "@/lib/student/flashcard-progress-client";
import { lessonPath } from "@/lib/student/paths";
import { shouldPersistStudentData } from "@/lib/student/student-scope";
import { EMPTY_FLASHCARDS, listIdSignature } from "@/lib/utils/collections";

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

function buildLessonCards(
  studentScope: string,
  courseId: string,
  lessonId: string,
  adminCards: ReturnType<typeof getFlashcardsFromStore>,
): Flashcard[] {
  const definitions = loadFlashcardDefinitions(studentScope, courseId, lessonId);
  return adminCards.map((card) => ({
    id: card.id,
    front: card.term,
    back: definitions[card.id] ?? "",
  }));
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
  const { activeStudentId } = useActiveStudent();
  const lessonMeta = getLessonClient(store, courseId, lessonId);
  const flashcardKey = lessonKey(courseId, lessonId);
  const storedFlashcards = store.flashcardsByLesson?.[flashcardKey];
  const adminCards = useMemo(
    () => storedFlashcards ?? EMPTY_FLASHCARDS,
    [storedFlashcards],
  );
  const adminCardSignature = useMemo(
    () => listIdSignature(adminCards),
    [adminCards],
  );
  const [state, setState] = useState<DeckState | null>(null);

  useEffect(() => {
    if (!studentScope || adminCards.length === 0) {
      setState(null);
      return;
    }

    const lessonCards = buildLessonCards(
      studentScope,
      courseId,
      lessonId,
      adminCards,
    );
    const persisted = loadPersistedState(studentScope, courseId, lessonId);
    setState(
      persisted
        ? mergeDeckWithCards(persisted, lessonCards)
        : createInitialDeckState(lessonCards),
    );
  }, [studentScope, courseId, lessonId, adminCards, adminCardSignature]);

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
      if (!activeStudentId) return;
      const card = adminCards.find((entry) => entry.id === cardId);
      void saveFlashcardDefinitionClient({
        familyStudentId: activeStudentId,
        courseId,
        lessonId,
        cardId,
        frontText: card?.term ?? "",
        definition,
      }).catch(() => {
        // Local definition is still saved; server sync is best-effort.
      });
    },
    [activeStudentId, adminCards, courseId, lessonId, studentScope],
  );

  const onCardRated = useCallback(
    (input: { cardId: string; front: string; isCorrect: boolean }) => {
      if (!activeStudentId) return;
      void recordFlashcardStudyEventClient({
        familyStudentId: activeStudentId,
        courseId,
        lessonId,
        cardId: input.cardId,
        frontText: input.front,
        isCorrect: input.isCorrect,
      }).catch(() => {
        // Best-effort server logging for parent digest emails.
      });
    },
    [activeStudentId, courseId, lessonId],
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
        onCardRated={onCardRated}
      />
    </div>
    </GuestLessonGuard>
  );
}
