import { describe, expect, it } from "vitest";

import {
  buildTextbookCoverAlt,
  createEmptyTextbook,
  getLessonReadings,
  getTextbookDisplayTitle,
  SEED_TEXTBOOKS,
} from "@/lib/student/textbook";
import { EMPTY_TEXTBOOK_READINGS } from "@/lib/utils/collections";

describe("textbook helpers", () => {
  it("includes seed biology textbook", () => {
    const book = SEED_TEXTBOOKS["biology-year-1"];
    expect(book.title).toBeTruthy();
    expect(book.coverSrc).toContain("/textbooks/");
  });

  it("formats display title", () => {
    expect(
      getTextbookDisplayTitle({
        title: "Life Science",
        subtitle: "A Biological Approach",
        authors: "",
        edition: "",
        publisher: "",
        coverSrc: "",
        coverAlt: "",
      }),
    ).toBe("Life Science: A Biological Approach");
  });

  it("builds cover alt text and empty template", () => {
    expect(buildTextbookCoverAlt("Life Science", "Vol 1")).toContain("Life Science");
    expect(createEmptyTextbook().title).toBe("");
  });

  describe("getLessonReadings", () => {
    it("returns readings for a known lesson", () => {
      const readings = getLessonReadings("scientific-method");
      expect(readings.length).toBeGreaterThan(0);
    });

    it("returns stable EMPTY_TEXTBOOK_READINGS for unknown lesson", () => {
      const first = getLessonReadings("nonexistent-lesson");
      const second = getLessonReadings("nonexistent-lesson");
      expect(first).toBe(EMPTY_TEXTBOOK_READINGS);
      expect(second).toBe(first);
      expect(first).toHaveLength(0);
    });
  });
});
