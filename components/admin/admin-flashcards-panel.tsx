"use client";

import { useState } from "react";

import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import { useContentStore } from "@/components/admin/content-store-provider";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import {
  applyPersistResult,
  errorSaveFeedback,
} from "@/lib/admin/admin-save-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugifyId } from "@/lib/admin/lesson-key";
import {
  getFlashcardsFromStore,
  setFlashcardsInStore,
} from "@/lib/admin/content-store";

export function AdminFlashcardsPanel() {
  const { store, persist, saving } = useContentStore();
  const { courseId, lessonId, setCourseId, setLessonId } = useAdminWorkspace();
  const [newTerm, setNewTerm] = useState("");
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);

  const flashcards = getFlashcardsFromStore(store, courseId, lessonId);

  async function saveFlashcards(nextCards: typeof flashcards, message: string) {
    setFeedback(null);
    const result = await persist(
      setFlashcardsInStore(store, courseId, lessonId, nextCards),
      { successMessage: message },
    );
    if (!result.ok) {
      setFeedback(errorSaveFeedback(result.error));
    }
  }

  async function handleAddTerm(e: React.FormEvent) {
    e.preventDefault();
    const term = newTerm.trim();
    if (!term) return;

    const id = `flashcard-${slugifyId(term)}-${Date.now()}`;
    if (flashcards.some((card) => card.term.toLowerCase() === term.toLowerCase())) {
      setFeedback({
        type: "error",
        message: `A flashcard for "${term}" already exists in this lesson.`,
      });
      return;
    }

    await saveFlashcards([...flashcards, { id, term }], `Added flashcard "${term}".`);
    setNewTerm("");
  }

  async function handleDelete(cardId: string, term: string) {
    if (!window.confirm(`Delete flashcard "${term}"?`)) return;
    await saveFlashcards(
      flashcards.filter((card) => card.id !== cardId),
      `Deleted flashcard "${term}".`,
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
            Flashcard terms
          </h2>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            Add the words or phrases students should learn. Students write their own
            definitions on the back of each card during review.
          </p>
        </div>

        <AdminLessonPicker
          store={store}
          courseId={courseId}
          lessonId={lessonId}
          onCourseChange={setCourseId}
          onLessonChange={setLessonId}
        />

        <form onSubmit={(e) => void handleAddTerm(e)} className="flex flex-wrap gap-3">
          <Input
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            placeholder="e.g. Photosynthesis"
            className="max-w-sm"
            required
          />
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : "Add term"}
          </Button>
        </form>

        <AdminActionFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />

        {flashcards.length === 0 ? (
          <p className="rounded-md border border-dashed border-sky-200 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:text-stone-400">
            No flashcards for this lesson yet. Add terms here or use Bulk import (CSV).
          </p>
        ) : (
          <ul className="divide-y divide-sky-100 rounded-md border border-sky-100 dark:divide-stone-800 dark:border-stone-700">
            {flashcards.map((card, index) => (
              <li
                key={card.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-stone-50">
                    {index + 1}. {card.term}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-stone-500">
                    id: {card.id}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                  disabled={saving}
                  onClick={() => void handleDelete(card.id, card.term)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
