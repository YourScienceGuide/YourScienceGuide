import { describe, expect, it } from "vitest";

import {
  getCourseClient,
  getLessonsByChapterClient,
  getTextbookClient,
} from "@/lib/student/curriculum-client";
import { makeStore } from "../../helpers/factories";

describe("curriculum client", () => {
  const store = makeStore();

  it("reads courses and lessons from store", () => {
    const course = getCourseClient(store, "biology-year-1");
    expect(course?.title).toContain("Biology");
    expect(course?.lessons.length).toBeGreaterThan(0);
  });

  it("groups chapters from store course", () => {
    const course = getCourseClient(store, "biology-year-1");
    if (!course) throw new Error("missing course");
    const chapters = getLessonsByChapterClient(course);
    expect(chapters[0].chapterTitle).toBeTruthy();
  });

  it("reads textbook from store", () => {
    const book = getTextbookClient(store, "biology-year-1");
    expect(book?.title).toBeTruthy();
  });
});
