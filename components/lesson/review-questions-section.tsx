"use client";

import { useCallback, useEffect, useState } from "react";

import { LessonToast } from "@/components/lesson/lesson-toast";
import { QuestionPanel } from "@/components/lesson/question-panel";
import { reviewStepLabel } from "@/lib/lesson/review-labels";
import {
  applyReviewCorrectAnswer,
  applyReviewHeldForToday,
} from "@/lib/lesson/review-state";
import {
  clearToast,
  hasHeldQuestionsRemaining,
  hydrateLessonState,
  INITIAL_LESSON_STATE,
  progressPercent,
  resolveActiveQuestionIndex,
  withAssignmentCount,
  type LessonMachineState,
} from "@/lib/lesson/state-machine";
import type { LessonQuestion } from "@/lib/lesson/types";
import {
  loadReviewProgress,
  saveReviewProgress,
} from "@/lib/student/review-progress";
import { storedToMachineState } from "@/lib/student/lesson-progress";
import { isQuestionLockedToday } from "@/lib/student/question-attempt-state";

type ReviewQuestionsSectionProps = {
  studentScope: string;
  courseId: string;
  lessonId: string;
  questions: LessonQuestion[];
  onAccessChange?: (canAccessLesson: boolean) => void;
};

export function ReviewQuestionsSection({
  studentScope,
  courseId,
  lessonId,
  questions,
  onAccessChange,
}: ReviewQuestionsSectionProps) {
  const [state, setState] = useState<LessonMachineState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadReviewProgress(studentScope, courseId, lessonId);
    const restored = storedToMachineState(stored);
    const base = restored ? { ...INITIAL_LESSON_STATE, ...restored } : INITIAL_LESSON_STATE;
    const withCount = withAssignmentCount(base, questions.length);
    const hydratedState = hydrateLessonState(withCount, questions, (questionId) =>
      isQuestionLockedToday(studentScope, courseId, lessonId, questionId),
    );
    setState(hydratedState);
    setHydrated(true);
  }, [courseId, lessonId, questions, studentScope]);

  useEffect(() => {
    if (!state || !hydrated) return;
    saveReviewProgress(studentScope, courseId, lessonId, state);
  }, [courseId, lessonId, state, hydrated, studentScope]);

  useEffect(() => {
    if (!state || !hydrated) return;
    const isLockedToday = (questionId: string) =>
      isQuestionLockedToday(studentScope, courseId, lessonId, questionId);
    const activeIndex = resolveActiveQuestionIndex(questions, state, isLockedToday);
    const heldOnly =
      !state.isComplete &&
      activeIndex === null &&
      hasHeldQuestionsRemaining(questions, state, isLockedToday);
    onAccessChange?.(state.isComplete || heldOnly);
  }, [courseId, lessonId, onAccessChange, questions, state, hydrated, studentScope]);

  const dismissToast = useCallback(() => {
    setState((current) => (current ? clearToast(current) : current));
  }, []);

  const handleAnswer = useCallback(
    (correct: boolean, questionId: string) => {
      if (!correct) return;
      setState((current) => {
        if (!current) return current;
        const next = applyReviewCorrectAnswer(current, questionId);
        return hydrateLessonState(next, questions, (id) =>
          isQuestionLockedToday(studentScope, courseId, lessonId, id),
        );
      });
    },
    [courseId, lessonId, questions, studentScope],
  );

  const handleHeldForToday = useCallback(
    (questionId: string) => {
      setState((current) => {
        if (!current) return current;
        const next = applyReviewHeldForToday(current, questionId);
        return hydrateLessonState(next, questions, (id) =>
          isQuestionLockedToday(studentScope, courseId, lessonId, id),
        );
      });
    },
    [courseId, lessonId, questions, studentScope],
  );

  if (questions.length === 0) {
    return null;
  }

  if (!state || !hydrated) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">Loading review…</p>
    );
  }

  const isLockedToday = (questionId: string) =>
    isQuestionLockedToday(studentScope, courseId, lessonId, questionId);

  const activeQuestionIndex = resolveActiveQuestionIndex(questions, state, isLockedToday);
  const currentQuestion =
    activeQuestionIndex !== null ? questions[activeQuestionIndex] : undefined;
  const heldQuestionsRemain =
    !state.isComplete &&
    activeQuestionIndex === null &&
    hasHeldQuestionsRemaining(questions, state, isLockedToday);

  const percent = progressPercent(state);
  const stepLabel = reviewStepLabel(
    activeQuestionIndex ?? state.completedQuestionIds.length,
    state.assignmentCount,
    state.isComplete,
  );

  return (
    <section className="space-y-6" aria-labelledby="review-questions-heading">
      <LessonToast message={state.toast} onDismiss={dismissToast} />

      <div className="space-y-1">
        <h2
          id="review-questions-heading"
          className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
        >
          Review questions
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Warm up with these questions from earlier lessons before you start today&apos;s
          material.
        </p>
      </div>

      <div
        className="rounded-lg border border-sky-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900"
        aria-label="Review progress"
      >
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-slate-800 dark:text-stone-200">{stepLabel}</span>
          <span className="tabular-nums text-slate-600 dark:text-stone-400">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-sky-100 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-sky-500 transition-[width] duration-300 dark:bg-sky-400"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {state.isComplete ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-4 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100">
          <p className="font-medium">Review complete!</p>
          <p className="mt-1 text-emerald-900 dark:text-emerald-200">
            You finished all {state.assignmentCount} review question
            {state.assignmentCount === 1 ? "" : "s"}. Scroll down to continue with
            today&apos;s lesson.
          </p>
        </div>
      ) : heldQuestionsRemain ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-medium">
            {state.heldQuestionIds.length === 1
              ? "1 review question is on hold until tomorrow."
              : `${state.heldQuestionIds.length} review questions are on hold until tomorrow.`}
          </p>
          <p className="mt-2 text-amber-900 dark:text-amber-200">
            You&apos;ve completed {state.completedQuestionIds.length} of{" "}
            {state.assignmentCount} review question
            {state.assignmentCount === 1 ? "" : "s"}. Come back tomorrow to finish the
            question
            {state.heldQuestionIds.length === 1 ? "" : "s"} still on hold. You can
            continue with the lesson below.
          </p>
        </div>
      ) : currentQuestion ? (
        <QuestionPanel
          key={`review-${studentScope}-${currentQuestion.id}`}
          studentScope={studentScope}
          courseId={courseId}
          lessonId={lessonId}
          question={currentQuestion}
          difficulty={state.difficulty}
          disabled={false}
          onSubmit={(correct) => {
            if (correct) {
              handleAnswer(true, currentQuestion.id);
            }
          }}
          onHeldForToday={() => handleHeldForToday(currentQuestion.id)}
        />
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Review questions could not be loaded. Please refresh the page.
        </p>
      )}
    </section>
  );
}
