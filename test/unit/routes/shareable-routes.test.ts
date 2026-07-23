import { describe, expect, it } from "vitest";

import {
  ADMIN_NAV_GROUPS,
  adminNavGroupForTab,
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
    expect(adminTabFromPathname("/admin/access")).toBe("access");
    expect(adminTabFromPathname("/admin/assignment")).toBe("assignment");
    expect(adminTabPath("videos")).toBe("/admin/videos");
  });

  it("groups admin tabs into four nav menus", () => {
    expect(ADMIN_NAV_GROUPS).toHaveLength(4);
    expect(ADMIN_NAV_GROUPS.map((group) => group.label)).toEqual([
      "Course Content",
      "Question Banks",
      "Grading & Access",
      "Comms & Support",
    ]);
    expect(adminNavGroupForTab("grading")?.label).toBe("Grading & Access");
    expect(adminNavGroupForTab("faq")?.label).toBe("Comms & Support");
    expect(adminNavGroupForTab("waitlist")?.label).toBe("Comms & Support");
    expect(adminTabFromPathname("/admin/waitlist")).toBe("waitlist");
    expect(adminNavGroupForTab("pricing")?.label).toBe("Comms & Support");
    expect(adminTabFromPathname("/admin/pricing")).toBe("pricing");
    expect(
      ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id)).sort(),
    ).toEqual(
      [
        "access",
        "algorithm",
        "assignment",
        "curriculum",
        "emails",
        "faq",
        "flashcards",
        "grading",
        "import",
        "pricing",
        "review",
        "videos",
        "waitlist",
      ].sort(),
    );
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
