import type { FamilyStudent, StudentPreferences } from "@/lib/family/types";

export type FamilyStudentRow = {
  id: string;
  parent_clerk_user_id: string;
  name: string;
  display_name: string;
  avatar_initials: string;
  email_on_lesson_complete: boolean;
  email_on_grading_required: boolean;
  show_grade_on_dashboard: boolean;
  created_at: string;
  updated_at: string;
};

export function deriveAvatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function deriveDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Student";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function rowToPreferences(row: FamilyStudentRow): StudentPreferences {
  return {
    emailOnLessonComplete: row.email_on_lesson_complete,
    emailOnGradingRequired: row.email_on_grading_required,
    showGradeOnDashboard: row.show_grade_on_dashboard,
  };
}

export function mapFamilyStudentRow(row: FamilyStudentRow): FamilyStudent {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    gradeLabel: "—",
    gradePercent: 0,
    courseName: "No course started",
    courseProgress: 0,
    avatarInitials: row.avatar_initials || deriveAvatarInitials(row.name),
    preferences: rowToPreferences(row),
  };
}
