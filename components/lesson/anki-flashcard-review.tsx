"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  deckCounts,
  getCurrentCard,
  ratingIntervalLabel,
  saveCardDefinition,
  showAnswer,
  rateCard,
} from "@/lib/lesson/flashcard-machine";
import type {
  AnkiRating,
  DeckState,
} from "@/lib/lesson/flashcard-types";

type AnkiFlashcardReviewProps = {
  state: DeckState;
  onStateChange: (state: DeckState) => void;
  onDefinitionSaved?: (cardId: string, definition: string) => void;
};

export function AnkiFlashcardReview({
  state,
  onStateChange,
  onDefinitionSaved,
}: AnkiFlashcardReviewProps) {
  const current = getCurrentCard(state);
  const counts = deckCounts(state);
  const [definitionDraft, setDefinitionDraft] = useState("");

  useEffect(() => {
    setDefinitionDraft(current?.back ?? "");
  }, [current?.id, current?.back]);

  const handleShowAnswer = useCallback(() => {
    onStateChange(showAnswer(state));
  }, [onStateChange, state]);

  const handleRate = useCallback(
    (rating: AnkiRating) => {
      onStateChange(rateCard(state, rating));
    },
    [onStateChange, state],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (state.phase === "define") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (state.phase === "question") handleShowAnswer();
        return;
      }

      if (state.phase !== "answer") return;

      const keyMap: Record<string, AnkiRating> = {
        "1": "again",
        "2": "hard",
        "3": "good",
        "4": "easy",
      };
      const rating = keyMap[e.key];
      if (rating) {
        e.preventDefault();
        handleRate(rating);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRate, handleShowAnswer, state.phase]);

  if (!current) {
    return null;
  }

  const card = current;

  function handleSaveDefinition(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = definitionDraft.trim();
    if (!trimmed) return;

    onStateChange(saveCardDefinition(state, card.id, trimmed));
    onDefinitionSaved?.(card.id, trimmed);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div
        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm tabular-nums"
        aria-label="Deck statistics"
      >
        <DeckStat label="New" count={counts.new} className="text-sky-700 dark:text-sky-300" />
        <DeckStat
          label="Learning"
          count={counts.learning}
          className="text-amber-700 dark:text-amber-300"
        />
        <DeckStat
          label="Review"
          count={counts.review}
          className="text-emerald-700 dark:text-emerald-300"
        />
      </div>

      <article
        className={cn(
          "flex min-h-[300px] flex-col rounded-xl border border-stone-300 bg-stone-100 shadow-sm",
          "dark:border-stone-600 dark:bg-stone-800",
        )}
        aria-live="polite"
      >
        <div className="flex flex-1 flex-col justify-center px-8 py-10 text-center">
          {state.phase === "define" ? (
            <form onSubmit={handleSaveDefinition} className="space-y-4 text-left">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Term
                </p>
                <p className="text-center text-xl font-medium leading-relaxed text-stone-900 dark:text-stone-50">
                  {current.front}
                </p>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="flashcard-definition"
                  className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400"
                >
                  Your definition
                </label>
                <textarea
                  id="flashcard-definition"
                  value={definitionDraft}
                  onChange={(e) => setDefinitionDraft(e.target.value)}
                  rows={4}
                  required
                  placeholder="Write the definition in your own words…"
                  className="w-full resize-y rounded-md border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
                />
              </div>
              <Button type="submit" className="w-full">
                Save definition
              </Button>
            </form>
          ) : state.phase === "question" ? (
            <>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Term
              </p>
              <p className="text-xl font-medium leading-relaxed text-stone-900 dark:text-stone-50">
                {current.front}
              </p>
            </>
          ) : (
            <div className="space-y-6 text-left">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Term
                </p>
                <p className="text-base text-stone-700 dark:text-stone-300">
                  {current.front}
                </p>
              </div>
              <hr className="border-stone-300 dark:border-stone-600" />
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Your definition
                </p>
                <p className="text-lg font-medium leading-relaxed text-stone-900 dark:text-stone-50">
                  {current.back}
                </p>
              </div>
            </div>
          )}
        </div>
      </article>

      {state.phase === "question" ? (
        <Button
          type="button"
          className="h-12 w-full text-base"
          onClick={handleShowAnswer}
        >
          Show my definition
          <span className="sr-only"> (Space)</span>
        </Button>
      ) : state.phase === "answer" ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <RatingButton
            rating="again"
            label="Again"
            interval={ratingIntervalLabel(current, "again")}
            onRate={handleRate}
          />
          <RatingButton
            rating="hard"
            label="Hard"
            interval={ratingIntervalLabel(current, "hard")}
            onRate={handleRate}
          />
          <RatingButton
            rating="good"
            label="Good"
            interval={ratingIntervalLabel(current, "good")}
            onRate={handleRate}
          />
          <RatingButton
            rating="easy"
            label="Easy"
            interval={ratingIntervalLabel(current, "easy")}
            onRate={handleRate}
          />
        </div>
      ) : null}

      {state.phase !== "define" && (
        <p className="text-center text-xs text-stone-500 dark:text-stone-500">
          {state.phase === "question"
            ? "Space to reveal your definition"
            : "Press 1–4 for Again, Hard, Good, or Easy"}
        </p>
      )}
    </div>
  );
}

function DeckStat({
  label,
  count,
  className,
}: {
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <span className={cn("font-medium", className)}>
      {label}: <span className="tabular-nums">{count}</span>
    </span>
  );
}

const RATING_STYLES: Record<
  AnkiRating,
  { button: string; shortcut: string }
> = {
  again: {
    button: "bg-red-600 hover:bg-red-700 text-white",
    shortcut: "1",
  },
  hard: {
    button: "bg-orange-500 hover:bg-orange-600 text-white",
    shortcut: "2",
  },
  good: {
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    shortcut: "3",
  },
  easy: {
    button: "bg-sky-600 hover:bg-sky-700 text-white",
    shortcut: "4",
  },
};

function RatingButton({
  rating,
  label,
  interval,
  onRate,
}: {
  rating: AnkiRating;
  label: string;
  interval: string;
  onRate: (rating: AnkiRating) => void;
}) {
  const styles = RATING_STYLES[rating];
  return (
    <button
      type="button"
      onClick={() => onRate(rating)}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg px-2 py-3 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        styles.button,
      )}
    >
      <span>{label}</span>
      <span className="mt-0.5 text-xs font-normal opacity-90">{interval}</span>
      <span className="sr-only"> ({styles.shortcut})</span>
    </button>
  );
}
