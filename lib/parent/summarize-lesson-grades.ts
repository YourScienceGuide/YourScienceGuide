export type LessonGradePoints = {
  earnedPoints: number;
  possiblePoints: number;
};

export function summarizeLessonGrades(
  lessonGrades: LessonGradePoints[],
  lessonCount: number,
): {
  totalEarnedPoints: number;
  totalPossiblePoints: number;
  courseProgress: number;
} {
  const totalEarnedPoints = lessonGrades.reduce(
    (sum, grade) => sum + grade.earnedPoints,
    0,
  );
  const totalPossiblePoints = lessonGrades.reduce(
    (sum, grade) => sum + grade.possiblePoints,
    0,
  );
  const courseProgress =
    lessonCount > 0
      ? Math.round((lessonGrades.length / lessonCount) * 100)
      : 0;

  return { totalEarnedPoints, totalPossiblePoints, courseProgress };
}
