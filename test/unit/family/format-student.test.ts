import { describe, expect, it } from "vitest";

import {
  deriveAvatarInitials,
  deriveDisplayName,
  mapFamilyStudentRow,
  rowToPreferences,
} from "@/lib/family/format-student";

describe("family student formatting", () => {
  const row = {
    id: "uuid-1",
    parent_clerk_user_id: "parent-1",
    name: "Alex Rivera",
    display_name: "Alex",
    avatar_initials: "",
    email_on_lesson_complete: true,
    email_on_grading_required: false,
    show_grade_on_dashboard: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("derives initials and display names", () => {
    expect(deriveAvatarInitials("Alex Rivera")).toBe("AR");
    expect(deriveAvatarInitials("Madonna")).toBe("MA");
    expect(deriveAvatarInitials("")).toBe("?");
    expect(deriveDisplayName("Alex Rivera")).toBe("Alex");
    expect(deriveDisplayName("  ")).toBe("Student");
  });

  it("maps database row to family student", () => {
    const student = mapFamilyStudentRow(row);
    expect(student.displayName).toBe("Alex");
    expect(student.avatarInitials).toBe("AR");
    expect(student.preferences.emailOnGradingRequired).toBe(false);
  });

  it("maps preferences from row", () => {
    expect(rowToPreferences(row)).toEqual({
      emailOnLessonComplete: true,
      emailOnGradingRequired: false,
      showGradeOnDashboard: true,
    });
  });
});
