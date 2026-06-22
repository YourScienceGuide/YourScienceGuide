import { describe, expect, it } from "vitest";

import {
  buildTextbookCoverAlt,
  createEmptyTextbook,
  getTextbookDisplayTitle,
  SEED_TEXTBOOKS,
} from "@/lib/student/textbook";

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
});
