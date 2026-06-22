import { describe, expect, it } from "vitest";

import {
  coursePath,
  lessonFlashcardsPath,
  lessonPath,
  lessonPracticePath,
} from "@/lib/student/paths";

describe("student paths", () => {
  it("builds course and lesson routes", () => {
    expect(coursePath("biology-year-1")).toBe("/student/biology-year-1");
    expect(lessonPath("biology-year-1", "cells-introduction")).toBe(
      "/student/biology-year-1/cells-introduction",
    );
    expect(lessonPracticePath("biology-year-1", "cells-introduction")).toBe(
      "/student/biology-year-1/cells-introduction/practice",
    );
    expect(lessonFlashcardsPath("biology-year-1", "cells-introduction")).toBe(
      "/student/biology-year-1/cells-introduction/flashcards",
    );
  });
});
