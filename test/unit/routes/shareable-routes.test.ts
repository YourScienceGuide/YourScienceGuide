import { describe, expect, it } from "vitest";

import {
  adminTabFromPathname,
  adminTabPath,
} from "@/lib/routes/admin";
import {
  parentSectionFromPathname,
  parentSectionPath,
} from "@/lib/routes/parent";
import {
  settingsSectionFromPathname,
  settingsSectionPath,
} from "@/lib/routes/settings";

describe("shareable route helpers", () => {
  it("maps admin paths to tabs", () => {
    expect(adminTabFromPathname("/admin/assignment")).toBe("assignment");
    expect(adminTabPath("videos")).toBe("/admin/videos");
  });

  it("maps parent paths to sections", () => {
    expect(parentSectionFromPathname("/parent/billing")).toBe("billing");
    expect(parentSectionPath("students")).toBe("/parent/students");
  });

  it("maps settings paths to sections", () => {
    expect(settingsSectionFromPathname("/settings/history")).toBe("history");
    expect(settingsSectionPath("account")).toBe("/settings/account");
  });
});
