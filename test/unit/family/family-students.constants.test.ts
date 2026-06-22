import { describe, expect, it } from "vitest";

import { MAX_FAMILY_STUDENTS } from "@/lib/family/family-students.constants";

describe("family students constants", () => {
  it("caps students per account", () => {
    expect(MAX_FAMILY_STUDENTS).toBeGreaterThan(0);
    expect(MAX_FAMILY_STUDENTS).toBe(5);
  });
});
