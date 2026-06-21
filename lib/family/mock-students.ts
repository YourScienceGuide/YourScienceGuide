import type { FamilyStudent } from "@/lib/family/types";

export const MOCK_FAMILY_STUDENTS: FamilyStudent[] = [
  {
    id: "student-alex",
    name: "Alex Rivera",
    displayName: "Alex",
    gradeLabel: "B+",
    gradePercent: 87,
    courseName: "YSG Life Science · Chapter 2",
    courseProgress: 66,
    avatarInitials: "AR",
    preferences: {
      emailOnLessonComplete: true,
      emailOnGradingRequired: true,
      showGradeOnDashboard: true,
    },
  },
  {
    id: "student-sam",
    name: "Sam Rivera",
    displayName: "Sam",
    gradeLabel: "A-",
    gradePercent: 91,
    courseName: "YSG Physical Science · Chapter 1",
    courseProgress: 42,
    avatarInitials: "SR",
    preferences: {
      emailOnLessonComplete: false,
      emailOnGradingRequired: true,
      showGradeOnDashboard: false,
    },
  },
  {
    id: "student-jordan",
    name: "Jordan Rivera",
    displayName: "Jordan",
    gradeLabel: "B",
    gradePercent: 84,
    courseName: "YSG Life Science · Chapter 1",
    courseProgress: 28,
    avatarInitials: "JR",
    preferences: {
      emailOnLessonComplete: true,
      emailOnGradingRequired: false,
      showGradeOnDashboard: true,
    },
  },
];

export function getFamilyStudent(id: string): FamilyStudent | undefined {
  return MOCK_FAMILY_STUDENTS.find((s) => s.id === id);
}
