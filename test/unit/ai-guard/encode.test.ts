import { describe, expect, it } from "vitest";

import {
  decodeAssessmentPayload,
  decodeBase64Utf8,
  encodeAssessmentPayload,
  insertCopyBreaks,
  toDisplayEncoding,
} from "@/lib/ai-guard/encode";

describe("ai-guard encoding", () => {
  it("round-trips assessment payloads", () => {
    const payload = { prompt: "What is DNA?", options: ["A", "B"] };
    const encoded = encodeAssessmentPayload(payload);
    expect(decodeAssessmentPayload<typeof payload>(encoded)).toEqual(payload);
  });

  it("encodes display text to base64", () => {
    const encoded = toDisplayEncoding("Hello");
    expect(decodeBase64Utf8(encoded)).toBe("Hello");
  });

  it("inserts zero-width breaks between characters", () => {
    const broken = insertCopyBreaks("abc");
    expect(broken.length).toBeGreaterThan(3);
    expect(broken.replace(/\u200b/g, "")).toBe("abc");
  });
});
