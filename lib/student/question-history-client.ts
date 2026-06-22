import type {
  QuestionAttemptRecord,
  QuestionAttemptSummary,
  RecordQuestionAttemptInput,
} from "@/lib/student/question-history.types";

export const QUESTION_ATTEMPT_RECORDED_EVENT = "ysg-question-attempt-recorded";

export function notifyQuestionAttemptRecorded() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(QUESTION_ATTEMPT_RECORDED_EVENT));
  }
}

export type QuestionHistoryResponse = {
  attempts: QuestionAttemptRecord[];
  summary: QuestionAttemptSummary;
  source: "supabase" | "unavailable";
};

export async function fetchQuestionHistory(params?: {
  courseId?: string;
  lessonId?: string;
  familyStudentId?: string;
}): Promise<QuestionHistoryResponse> {
  const search = new URLSearchParams();
  if (params?.courseId) search.set("courseId", params.courseId);
  if (params?.lessonId) search.set("lessonId", params.lessonId);
  if (params?.familyStudentId) search.set("familyStudentId", params.familyStudentId);

  const query = search.toString();
  const res = await fetch(
    `/api/student/question-attempts${query ? `?${query}` : ""}`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    throw new Error("Failed to load question history");
  }

  return (await res.json()) as QuestionHistoryResponse;
}

export async function recordQuestionAttempt(
  input: RecordQuestionAttemptInput,
): Promise<void> {
  const res = await fetch("/api/student/question-attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) return;
  notifyQuestionAttemptRecorded();
}
