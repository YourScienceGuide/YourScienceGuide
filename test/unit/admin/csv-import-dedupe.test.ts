import { describe, expect, it } from "vitest";

import {
  chapterQuestionContentKey,
  filterNewChapterQuestionsByLesson,
  filterNewFlashcardsByLesson,
  filterNewLessonQuestionsByLesson,
  flashcardContentKey,
  lessonQuestionContentKey,
  partitionNewItems,
} from "@/lib/admin/csv-import-dedupe";
import type { AdminFlashcard } from "@/lib/lesson/admin-flashcard-types";
import { makeChapterChoice, makeMultipleChoice } from "../../helpers/factories";

describe("csv-import-dedupe", () => {
  it("treats questions with different ids but identical content as duplicates", () => {
    const existing = makeChapterChoice({
      id: "existing-1",
      prompt: "Question?",
      options: ["A", "B"],
      correctIndex: 1,
      difficulty: 2,
    });
    const incoming = makeChapterChoice({
      id: "incoming-1",
      prompt: "Question?",
      options: ["A", "B"],
      correctIndex: 1,
      difficulty: 2,
    });

    expect(chapterQuestionContentKey(existing)).toBe(chapterQuestionContentKey(incoming));

    const { newItems, skippedDuplicateCount } = partitionNewItems(
      [existing],
      [incoming],
      chapterQuestionContentKey,
    );
    expect(newItems).toHaveLength(0);
    expect(skippedDuplicateCount).toBe(1);
  });

  it("ignores id when comparing lesson questions", () => {
    const existing = makeMultipleChoice({ id: "a", prompt: "Pick", options: ["X", "Y"], correctIndex: 0 });
    const incoming = makeMultipleChoice({ id: "b", prompt: "Pick", options: ["X", "Y"], correctIndex: 0 });

    expect(lessonQuestionContentKey(existing)).toBe(lessonQuestionContentKey(incoming));
  });

  it("dedupes within a single import batch", () => {
    const cardA: AdminFlashcard = { id: "a", term: "Mitochondria" };
    const cardB: AdminFlashcard = { id: "b", term: "mitochondria" };

    const { newItems, skippedDuplicateCount } = partitionNewItems(
      [],
      [cardA, cardB],
      flashcardContentKey,
    );
    expect(newItems).toHaveLength(1);
    expect(skippedDuplicateCount).toBe(1);
  });

  it("filters chapter questions by lesson key", () => {
    const existing = {
      "course/lesson-a": [
        makeChapterChoice({
          id: "old",
          prompt: "Same?",
          options: ["Yes", "No"],
          correctIndex: 0,
          difficulty: 1,
        }),
      ],
    };
    const incoming = {
      "course/lesson-a": [
        makeChapterChoice({
          id: "new",
          prompt: "Same?",
          options: ["Yes", "No"],
          correctIndex: 0,
          difficulty: 1,
        }),
        makeChapterChoice({
          id: "new-2",
          prompt: "Different?",
          options: ["Maybe", "No"],
          correctIndex: 1,
          difficulty: 1,
        }),
      ],
    };

    const result = filterNewChapterQuestionsByLesson(existing, incoming);
    expect(result.importableCount).toBe(1);
    expect(result.skippedDuplicateCount).toBe(1);
    expect(result.filteredByLesson["course/lesson-a"]).toHaveLength(1);
    expect(result.filteredByLesson["course/lesson-a"]![0].prompt).toBe("Different?");
  });

  it("filters review questions separately from chapter bank", () => {
    const existing = {
      "course/lesson-a": [makeMultipleChoice({ id: "r1", prompt: "Warm-up?" })],
    };
    const incoming = {
      "course/lesson-a": [
        makeMultipleChoice({ id: "r2", prompt: "Warm-up?" }),
        makeMultipleChoice({ id: "r3", prompt: "New warm-up?" }),
      ],
    };

    const result = filterNewLessonQuestionsByLesson(existing, incoming);
    expect(result.importableCount).toBe(1);
    expect(result.skippedDuplicateCount).toBe(1);
  });

  it("filters flashcards by normalized term", () => {
    const existing = {
      "course/lesson-a": [{ id: "f1", term: "Ribosome" }],
    };
    const incoming = {
      "course/lesson-a": [
        { id: "f2", term: " ribosome " },
        { id: "f3", term: "Nucleus" },
      ],
    };

    const result = filterNewFlashcardsByLesson(existing, incoming);
    expect(result.importableCount).toBe(1);
    expect(result.skippedDuplicateCount).toBe(1);
    expect(result.filteredByLesson["course/lesson-a"]![0].term).toBe("Nucleus");
  });
});
