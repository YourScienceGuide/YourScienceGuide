"use client";

import { useCallback } from "react";

import { useLessonAssessment } from "@/components/lesson/lesson-assessment-provider";
import { LessonToast } from "@/components/lesson/lesson-toast";
import { QuestionPanel } from "@/components/lesson/question-panel";
import { useQuestionAttemptRecorder } from "@/components/student/use-question-attempt-recorder";
import { Button } from "@/components/ui/button";
import {
  applyAlcumusCorrect,
  applyAlcumusIncorrect,
  clearAlcumusFeedback,
  clearAlcumusToast,
  getCurrentProblem,
  practiceStepLabel,
  type AlcumusState,
} from "@/lib/lesson/alcumus-machine";
import { lessonPath } from "@/lib/student/paths";
import Link from "next/link";

type AlcumusPracticeProps = {
  studentScope: string;
  courseId: string;
  lessonId: string;
  state: AlcumusState;
  onStateChange: (state: AlcumusState) => void;
};

export function AlcumusPractice({
  studentScope,
  courseId,
  lessonId,
  state,
  onStateChange,
}: AlcumusPracticeProps) {
  const { practice } = useLessonAssessment();
  const { recordAlcumusAttempt } = useQuestionAttemptRecorder(courseId, lessonId);

  const dismissToast = useCallback(() => {
    onStateChange(clearAlcumusToast(state));
  }, [onStateChange, state]);

  const problem = getCurrentProblem(practice, state);

  const handleSubmit = useCallback(
    (correct: boolean) => {
      if (!correct) return;
      onStateChange(clearAlcumusFeedback(applyAlcumusCorrect(practice, state)));
    },
    [onStateChange, practice, state],
  );

  const handleAnswerChecked = useCallback(
    (result: {
      questionId: string;
      questionType: string;
      prompt: string;
      isCorrect: boolean;
    }) => {
      void recordAlcumusAttempt(result);
      if (!result.isCorrect) {
        onStateChange(applyAlcumusIncorrect(practice, state));
      }
    },
    [onStateChange, practice, recordAlcumusAttempt, state],
  );

  if (state.isComplete) {
    return (
      <section
        className="rounded-lg border border-sky-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900"
        aria-label="Extra practice complete"
      >
        <LessonToast message={state.toast} onDismiss={dismissToast} />
        <p className="text-lg font-medium text-slate-900 dark:text-stone-50">
          Extra practice complete!
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-stone-400">
          You answered all {state.questionIds.length} question
          {state.questionIds.length === 1 ? "" : "s"} correctly.
        </p>
        <Button asChild className="mt-4">
          <Link href={lessonPath(courseId, lessonId)}>Back to lesson</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-label="Extra practice problems">
      <LessonToast message={state.toast} onDismiss={dismissToast} />

      <p className="text-sm text-slate-600 dark:text-stone-400">
        {practiceStepLabel(state)}
      </p>

      <QuestionPanel
        key={problem.id}
        studentScope={studentScope}
        courseId={courseId}
        lessonId={lessonId}
        question={problem}
        difficulty={1}
        skipAttemptLimits
        disabled={false}
        onSubmit={handleSubmit}
        onAnswerChecked={handleAnswerChecked}
      />
    </section>
  );
}
