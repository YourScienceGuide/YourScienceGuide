export type SyncLessonGradeInput = {
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  earnedPoints: number;
  possiblePoints: number;
  percent: number;
  problemsSolved: number;
  graduated: boolean;
  scoreBreakdown: Record<string, number>;
  phaseProgress: Record<string, unknown>;
};

export async function syncLessonGrade(payload: SyncLessonGradeInput): Promise<void> {
  const response = await fetch("/api/student/lesson-grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to sync lesson grade");
  }
}

export type SubmitLongAnswerInput = {
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  questionId: string;
  promptExcerpt: string;
  answerText: string;
  maxPoints: number;
};

export async function submitLongAnswer(
  payload: SubmitLongAnswerInput,
): Promise<{ id: string }> {
  let response: Response;
  try {
    response = await fetch("/api/student/long-answer-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Check your network connection and try again.");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(
      body.error ?? "Could not submit your response. Check your network connection and try again.",
    );
  }
  return (await response.json()) as { id: string };
}
