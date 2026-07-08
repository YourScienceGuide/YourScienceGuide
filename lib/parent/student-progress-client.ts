import type { GradingRubricConfig, RubricLineItem } from "@/lib/lesson/lesson-grade-config";
import type { LessonGradeRecord, LongAnswerSubmission } from "@/lib/student/lesson-grades.server";

export type ParentStudentProgressResponse = {
  source: "supabase" | "unavailable";
  courseId: string;
  courseName: string;
  rubric: {
    config: GradingRubricConfig;
    items: RubricLineItem[];
    maxScore: number;
  };
  lessonGrades: LessonGradeRecord[];
  pendingSubmissions: LongAnswerSubmission[];
  totalEarnedPoints: number;
  totalPossiblePoints: number;
  courseProgress: number;
};

export async function fetchParentStudentProgress(
  familyStudentId: string,
  courseId?: string,
): Promise<ParentStudentProgressResponse> {
  const params = new URLSearchParams({ familyStudentId });
  if (courseId) params.set("courseId", courseId);

  const response = await fetch(`/api/parent/student-progress?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load student progress");
  }
  return (await response.json()) as ParentStudentProgressResponse;
}

export async function gradeSubmission(input: {
  submissionId: string;
  parentScore: number;
  parentFeedback?: string;
}): Promise<void> {
  const response = await fetch("/api/parent/grade-submission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to grade submission");
  }
}
