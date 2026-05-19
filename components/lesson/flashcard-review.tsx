"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  custom?: boolean;
};

const SEED_FLASHCARDS: Flashcard[] = [
  {
    id: "seed-1",
    front: "Photosynthesis",
    back: "Plants use sunlight, water, and carbon dioxide to make sugar and release oxygen.",
  },
  {
    id: "seed-2",
    front: "Cell wall",
    back: "A rigid outer layer that gives plant cells shape and protection.",
  },
  {
    id: "seed-3",
    front: "Mitochondria",
    back: "Organelles that turn food into energy the cell can use.",
  },
];

export function FlashcardReview() {
  const [cards, setCards] = useState<Flashcard[]>(SEED_FLASHCARDS);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  const current = cards[index];
  const total = cards.length;

  function goTo(nextIndex: number) {
    setIndex(nextIndex);
    setFlipped(false);
  }

  function handlePrev() {
    goTo(index === 0 ? total - 1 : index - 1);
  }

  function handleNext() {
    goTo(index === total - 1 ? 0 : index + 1);
  }

  function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    const trimmedFront = front.trim();
    const trimmedBack = back.trim();
    if (!trimmedFront || !trimmedBack) return;

    const newCard: Flashcard = {
      id: `custom-${Date.now()}`,
      front: trimmedFront,
      back: trimmedBack,
      custom: true,
    };

    setCards((prev) => {
      const next = [...prev, newCard];
      goTo(next.length - 1);
      return next;
    });
    setFront("");
    setBack("");
    setAddedMessage("Flashcard saved! You can review it anytime.");
    window.setTimeout(() => setAddedMessage(null), 3000);
  }

  return (
    <section className="space-y-6 border-t border-sky-200 pt-10 dark:border-stone-700">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Flashcard review
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Review earlier topics or add your own cards to study later.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Button type="button" variant="ghost" size="sm" onClick={handlePrev}>
            Previous
          </Button>
          <span className="text-sm tabular-nums text-slate-600 dark:text-stone-400">
            Card {index + 1} of {total}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={handleNext}>
            Next
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className={cn(
            "flex min-h-40 w-full flex-col items-center justify-center rounded-lg border px-6 py-8 text-center transition-colors",
            "border-sky-200 bg-sky-50/50 hover:bg-sky-50 dark:border-stone-600 dark:bg-stone-800/50 dark:hover:bg-stone-800",
          )}
        >
          <span className="mb-2 text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
            {flipped ? "Answer" : "Term"}
            {current.custom ? " · Yours" : ""}
          </span>
          <span className="text-lg font-medium text-slate-900 dark:text-stone-50">
            {flipped ? current.back : current.front}
          </span>
          <span className="mt-4 text-xs text-slate-500 dark:text-stone-500">
            Tap to {flipped ? "show term" : "reveal answer"}
          </span>
        </button>
      </div>

      <form
        onSubmit={handleAddCard}
        className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900"
      >
        <h3 className="text-sm font-medium text-slate-900 dark:text-stone-50">
          Create a custom flashcard
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label
              htmlFor="flashcard-front"
              className="text-xs font-medium text-slate-600 dark:text-stone-400"
            >
              Front (term or question)
            </label>
            <input
              id="flashcard-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="e.g. Chlorophyll"
              className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="flashcard-back"
              className="text-xs font-medium text-slate-600 dark:text-stone-400"
            >
              Back (definition or answer)
            </label>
            <textarea
              id="flashcard-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              placeholder="e.g. Green pigment that absorbs light for photosynthesis"
              className="w-full resize-y rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
            />
          </div>
        </div>
        {addedMessage && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {addedMessage}
          </p>
        )}
        <Button type="submit">Save flashcard</Button>
      </form>
    </section>
  );
}
