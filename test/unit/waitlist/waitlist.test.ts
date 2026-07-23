import { describe, expect, it } from "vitest";

import {
  isValidWaitlistEmail,
  normalizeWaitlistEmail,
  normalizeWaitlistName,
} from "@/lib/waitlist/waitlist";

describe("waitlist helpers", () => {
  it("normalizes and validates emails", () => {
    expect(normalizeWaitlistEmail("  Alex@Example.COM ")).toBe(
      "alex@example.com",
    );
    expect(isValidWaitlistEmail("alex@example.com")).toBe(true);
    expect(isValidWaitlistEmail("not-an-email")).toBe(false);
    expect(isValidWaitlistEmail("")).toBe(false);
  });

  it("normalizes optional names", () => {
    expect(normalizeWaitlistName("  Alex  ")).toBe("Alex");
    expect(normalizeWaitlistName("")).toBeNull();
    expect(normalizeWaitlistName(undefined)).toBeNull();
  });
});
