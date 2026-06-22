import { describe, expect, it } from "vitest";

import { lessonKey, slugifyId } from "@/lib/admin/lesson-key";

describe("lesson-key", () => {
  it("builds composite lesson keys", () => {
    expect(lessonKey("biology-year-1", "cells-introduction")).toBe(
      "biology-year-1/cells-introduction",
    );
  });

  it("slugifies ids", () => {
    expect(slugifyId("  Hello World!  ")).toBe("hello-world");
    expect(slugifyId("---already---")).toBe("already");
  });
});
