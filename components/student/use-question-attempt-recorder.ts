"use client";

import { useCallback } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useActiveStudent } from "@/components/family/active-student-provider";
import {
  excerptPrompt,
  type RecordQuestionAttemptInput,
} from "@/lib/student/question-history.types";
import { recordQuestionAttempt } from "@/lib/student/question-history-client";

type RecordAssignmentAttemptArgs = {
  questionId: string;
  questionType: string;
  prompt: string;
  isCorrect: boolean;
};

type RecordAlcumusAttemptArgs = {
  questionId: string;
  questionType: string;
  prompt: string;
  isCorrect: boolean;
};

export function useQuestionAttemptRecorder(courseId: string, lessonId: string) {
  const { isGuest, isLoggedIn } = useAuth();
  const { activeStudentId } = useActiveStudent();

  const recordAssignmentAttempt = useCallback(
    async ({ questionId, questionType, prompt, isCorrect }: RecordAssignmentAttemptArgs) => {
      if (isGuest || !isLoggedIn || !activeStudentId) return;

      const payload: RecordQuestionAttemptInput = {
        familyStudentId: activeStudentId,
        courseId,
        lessonId,
        questionId,
        activity: "assignment",
        questionType,
        promptExcerpt: excerptPrompt(prompt),
        isCorrect,
      };

      await recordQuestionAttempt(payload);
    },
    [activeStudentId, courseId, isGuest, isLoggedIn, lessonId],
  );

  const recordAlcumusAttempt = useCallback(
    async ({ questionId, questionType, prompt, isCorrect }: RecordAlcumusAttemptArgs) => {
      if (isGuest || !isLoggedIn || !activeStudentId) return;

      const payload: RecordQuestionAttemptInput = {
        familyStudentId: activeStudentId,
        courseId,
        lessonId,
        questionId,
        activity: "alcumus",
        questionType,
        promptExcerpt: excerptPrompt(prompt),
        isCorrect,
      };

      await recordQuestionAttempt(payload);
    },
    [activeStudentId, courseId, isGuest, isLoggedIn, lessonId],
  );

  return { recordAssignmentAttempt, recordAlcumusAttempt };
}
