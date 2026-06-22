import { describe, expect, it } from "vitest";

import { isUploadedCoverSrc } from "@/lib/admin/textbook-cover";

describe("textbook cover helpers", () => {
  it("detects uploaded or remote cover sources", () => {
    expect(isUploadedCoverSrc("data:image/png;base64,abc")).toBe(true);
    expect(isUploadedCoverSrc("https://cdn.example.com/cover.jpg")).toBe(true);
    expect(isUploadedCoverSrc("http://example.com/cover.jpg")).toBe(true);
    expect(isUploadedCoverSrc("/textbooks/local.svg")).toBe(false);
  });
});
