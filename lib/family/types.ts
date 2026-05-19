export type StudentPreferences = {
  emailOnLessonComplete: boolean;
  emailOnGradingRequired: boolean;
  showGradeOnDashboard: boolean;
};

export type FamilyStudent = {
  id: string;
  name: string;
  displayName: string;
  gradeLabel: string;
  gradePercent: number;
  courseName: string;
  courseProgress: number;
  avatarInitials: string;
  preferences: StudentPreferences;
};
