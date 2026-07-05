import { describe, expect, it } from "vitest";

import { listIdSignature } from "@/lib/utils/collections";

describe("listIdSignature", () => {
  it("returns empty string for an empty list", () => {
    expect(listIdSignature([])).toBe("");
  });

  it("joins item ids in order", () => {
    expect(
      listIdSignature([
        { id: "a" },
        { id: "b" },
        { id: "c" },
      ]),
    ).toBe("a,b,c");
  });

  it("changes when ids change", () => {
    const first = listIdSignature([{ id: "x" }, { id: "y" }]);
    const second = listIdSignature([{ id: "x" }, { id: "z" }]);
    expect(first).not.toBe(second);
  });
});
