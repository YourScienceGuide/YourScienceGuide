"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AnkiFlashcardReview } from "@/components/lesson/anki-flashcard-review";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import { Button } from "@/components/ui/button";
import {
  createInitialDeckState,
  masteryPercent,
  masteryStepLabel,
} from "@/lib/lesson/flashcard-machine";
import type { DeckState } from "@/lib/lesson/flashcard-types";

const FLASHCARD_STORAGE_KEY = "ysg-flashcard-deck-state";

function loadPersistedState(): DeckState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FLASHCARD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeckState;
    if (!parsed.entries?.length || !parsed.currentCardId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function FlashcardReviewPage() {
  const [state, setState] = useState<DeckState | null>(null);

  useEffect(() => {
    if (!state) {
      setState(loadPersistedState() ?? createInitialDeckState());
    }
  }, [state]);

  useEffect(() => {
    if (!state) return;
    sessionStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const onStateChange = useCallback((next: DeckState) => {
    setState(next);
  }, []);

  if (!state) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading flashcards…
      </p>
    );
  }

  const percent = masteryPercent(state);
  const stepLabel = masteryStepLabel(state);

  return (
    <div className="space-y-8">
      <LessonProgressRail
        percent={percent}
        stepLabel={`Mastery · ${stepLabel}`}
        ariaLabel="Flashcard deck mastery progress"
        trailing={
          <Button variant="ghost" asChild size="sm" className="shrink-0 self-end sm:self-center">
            <Link href="/lesson">
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
        <p className="text-base text-slate-600 dark:text-stone-400">
          Study with an Anki-style deck—show the answer, then rate how well you
          remembered. Progress is separate from your lesson assignment.
        </p>
      </header>

      <AnkiFlashcardReview state={state} onStateChange={onStateChange} />
    </div>
  );
}
