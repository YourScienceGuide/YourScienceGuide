import { describe, expect, it } from "vitest";

import {
  isLessonDetailsDraftDirty,
  nextLessonSlot,
  syncLessonDraftsWithSaved,
} from "@/lib/admin/curriculum-lesson-drafts";
import type { CurriculumLesson } from "@/lib/student/curriculum-types";

function lesson(
  partial: Partial<CurriculumLesson> & Pick<CurriculumLesson, "id" | "title">,
): CurriculumLesson {
  const chapter = partial.chapter ?? 1;
  const section = partial.section ?? 1;
  return {
    id: partial.id,
    chapterId: partial.chapterId ?? `chapter-${chapter}`,
    chapterTitle: partial.chapterTitle ?? `Chapter ${chapter}`,
    title: partial.title,
    description: partial.description ?? "",
    chapter,
    section,
    order: partial.order ?? chapter * 1000 + section,
  };
}

describe("curriculum lesson drafts (admin/curriculum bugs)", () => {
  it("syncs drafts to include a newly added lesson instead of keeping a stale list", () => {
    const before = [
      lesson({ id: "welcome", title: "Welcome!", chapter: 0, section: 1 }),
      lesson({
        id: "lesson-1",
        title: "Lesson 1",
        chapter: 1,
        section: 1,
      }),
    ];
    const afterAdd = [
      ...before,
      lesson({
        id: "lesson-3-electrons",
        title: "Lesson 3: Electrons",
        chapter: 1,
        section: 3,
      }),
    ];

    // Simulate post-add: store already has the new lesson, drafts still old.
    const synced = syncLessonDraftsWithSaved(afterAdd, before);

    expect(synced).toHaveLength(3);
    expect(synced.map((entry) => entry.id)).toEqual([
      "welcome",
      "lesson-1",
      "lesson-3-electrons",
    ]);
    expect(isLessonDetailsDraftDirty(synced, afterAdd)).toBe(false);
  });

  it("does not treat membership lag as unsaved title/description edits", () => {
    const saved = [
      lesson({ id: "a", title: "A", chapter: 1, section: 1 }),
      lesson({ id: "b", title: "B", chapter: 1, section: 2 }),
    ];
    const staleDrafts = [saved[0]];

    expect(isLessonDetailsDraftDirty(staleDrafts, saved)).toBe(false);
  });

  it("preserves in-progress title edits for lessons that still exist after add", () => {
    const savedBefore = [
      lesson({
        id: "lesson-1",
        title: "Lesson 1",
        description: "Original",
        chapter: 1,
        section: 1,
      }),
    ];
    const draftsWithEdit = [
      lesson({
        id: "lesson-1",
        title: "Lesson 1 renamed",
        description: "Edited description",
        chapter: 1,
        section: 1,
      }),
    ];
    const savedAfterAdd = [
      ...savedBefore,
      lesson({
        id: "lesson-2",
        title: "Lesson 2",
        chapter: 1,
        section: 2,
      }),
    ];

    const synced = syncLessonDraftsWithSaved(savedAfterAdd, draftsWithEdit);

    expect(synced).toHaveLength(2);
    expect(synced.find((entry) => entry.id === "lesson-1")).toMatchObject({
      title: "Lesson 1 renamed",
      description: "Edited description",
    });
    expect(synced.find((entry) => entry.id === "lesson-2")?.title).toBe(
      "Lesson 2",
    );
    expect(isLessonDetailsDraftDirty(synced, savedAfterAdd)).toBe(true);
  });

  it("keeps local title edits when membership is unchanged", () => {
    const saved = [
      lesson({
        id: "lesson-1",
        title: "Lesson 1",
        description: "Original",
        chapter: 1,
        section: 1,
      }),
    ];
    const drafts = [
      lesson({
        id: "lesson-1",
        title: "Renamed",
        description: "Original",
        chapter: 1,
        section: 1,
      }),
    ];

    expect(syncLessonDraftsWithSaved(saved, drafts)).toEqual(drafts);
    expect(isLessonDetailsDraftDirty(drafts, saved)).toBe(true);
  });

  it("suggests the next free chapter/section after existing lessons", () => {
    const lessons = [
      lesson({ id: "a", title: "A", chapter: 1, section: 1 }),
      lesson({ id: "b", title: "B", chapter: 1, section: 2 }),
    ];
    expect(nextLessonSlot(lessons)).toEqual({
      chapter: 1,
      section: 3,
      chapterTitle: "Chapter 1",
    });
  });
});
