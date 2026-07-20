import { describe, expect, it } from "vitest";

import { getHeaderEnvLabel } from "@/lib/deploy-label";

describe("getHeaderEnvLabel", () => {
  it("hides the label in production", () => {
    expect(
      getHeaderEnvLabel({
        vercelEnv: "production",
        gitCommitRef: "master",
      }),
    ).toBeNull();
  });

  it("shows the git branch on Vercel preview", () => {
    expect(
      getHeaderEnvLabel({
        vercelEnv: "preview",
        gitCommitRef: "staging",
      }),
    ).toBe("staging");
  });

  it("falls back to vercel env when branch is missing", () => {
    expect(
      getHeaderEnvLabel({
        vercelEnv: "preview",
        gitCommitRef: "",
      }),
    ).toBe("preview");
  });

  it("shows localhost when not on Vercel", () => {
    expect(getHeaderEnvLabel({ vercelEnv: "", gitCommitRef: "" })).toBe(
      "localhost",
    );
  });
});
