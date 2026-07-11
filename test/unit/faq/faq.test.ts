import { describe, expect, it, vi } from "vitest";

import { DEFAULT_FAQ_CONTENT } from "@/lib/faq/default-faq";

vi.mock("server-only", () => ({}));

describe("FAQ defaults", () => {
  it("includes starter questions", () => {
    expect(DEFAULT_FAQ_CONTENT.title.length).toBeGreaterThan(0);
    expect(DEFAULT_FAQ_CONTENT.entries.length).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_FAQ_CONTENT.entries.every((entry) => entry.published)).toBe(true);
  });
});

describe("saveFaqContent validation", () => {
  it("rejects empty title", async () => {
    const { saveFaqContent } = await import("@/lib/faq/faq.server");
    await expect(
      saveFaqContent({
        title: " ",
        intro: "",
        entries: DEFAULT_FAQ_CONTENT.entries,
      }),
    ).rejects.toThrow(/title is required/i);
  });

  it("rejects entries missing question or answer", async () => {
    const { saveFaqContent } = await import("@/lib/faq/faq.server");
    await expect(
      saveFaqContent({
        title: "FAQ",
        intro: "",
        entries: [
          {
            id: "bad",
            question: "",
            answer: "Answer",
            sortOrder: 0,
            published: true,
          },
        ],
      }),
    ).rejects.toThrow(/question and answer/i);
  });
});
