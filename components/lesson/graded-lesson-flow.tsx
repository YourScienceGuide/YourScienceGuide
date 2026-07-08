"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { notifyProgressUpdated } from "@/components/student/use-course-progress";
import { useContentStore } from "@/components/admin/content-store-provider";
import { GradingRubricSummary } from "@/components/grading/grading-rubric-summary";
import { QuestionPanel } from "@/components/lesson/question-panel";
import { getCourseClient, getLessonClient } from "@/lib/student/curriculum-client";
import { getGradingConfigFromStore } from "@/lib/admin/content-store";
import { buildLessonAssessmentPlan } from "@/lib/lesson/lesson-assessment-plan";
import {
  applyExtraCorrect,
  applyFibCorrect,
  applyFibHeldForToday,
  applyFreeResponseSubmitted,
  applyMcResult,
  applyReviewCorrect,
  applyReviewHeldForToday,
  calculateLessonCompletionPercent,
  calculateLessonScore,
  canAccessLessonDuringReview,
  checkGraduation,
  currentExtraQuestionId,
  currentFibQuestionId,
  currentMcQuestionId,
  currentReviewQuestionId,
  hydrateGradedProgress,
  reviewPhaseComplete,
  type GradedLessonProgress,
} from "@/lib/lesson/graded-lesson-machine";
import {
  graduationThresholdForLesson,
} from "@/lib/lesson/lesson-grade-config";
import { excerptPrompt } from "@/lib/student/question-history.types";
import {
  loadGradedLessonProgress,
  saveGradedLessonProgress,
} from "@/lib/student/graded-lesson-progress";
import {
  submitLongAnswer,
  syncLessonGrade,
} from "@/lib/student/lesson-grades-client";
import { isQuestionLockedToday } from "@/lib/student/question-attempt-state";
import type { LessonQuestion } from "@/lib/lesson/types";

type GradedLessonFlowProps = {
  studentScope: string;
  familyStudentId: string | null;
  courseId: string;
  lessonId: string;
  onAccessChange?: (canAccessLesson: boolean) => void;
  /** Notifies listeners when lesson completion changes (for course progress refresh). */
  onCompletionChange?: (percent: number) => void;
  children?: ReactNode;
};

function findQuestion(
  plan: ReturnType<typeof buildLessonAssessmentPlan>,
  id: string | null,
): LessonQuestion | null {
  if (!id) return null;
  const all = [
    ...plan.review,
    ...plan.multipleChoice,
    ...plan.fillInBlank,
    ...plan.extraPractice,
    ...(plan.freeResponse ? [plan.freeResponse] : []),
  ];
  return all.find((q) => q.id === id) ?? null;
}

function advanceAfterReview(
  progress: GradedLessonProgress,
  plan: NonNullable<ReturnType<typeof buildLessonAssessmentPlan>>,
  isLockedToday: (questionId: string) => boolean,
): GradedLessonProgress {
  if (!reviewPhaseComplete(progress, plan.review, isLockedToday)) {
    return progress;
  }
  return {
    ...progress,
    phase: plan.multipleChoice.length > 0 ? "multiple-choice" : "fill-in-blank",
  };
}

export function GradedLessonFlow({
  studentScope,
  familyStudentId,
  courseId,
  lessonId,
  onAccessChange,
  onCompletionChange,
  children,
}: GradedLessonFlowProps) {
  const { store } = useContentStore();
  const course = getCourseClient(store, courseId);
  const lesson = getLessonClient(store, courseId, lessonId);
  const storedRubric = store.gradingConfigByCourse?.[courseId];
  const rubric = useMemo(
    () => getGradingConfigFromStore(store, courseId),
    [storedRubric, courseId],
  );
  const plan = useMemo(() => {
    if (!course || !lesson) return null;
    return buildLessonAssessmentPlan(store, course, lesson, rubric);
  }, [course, lesson, rubric, store]);
  const planIdentity = useMemo(() => {
    if (!plan) return null;
    return [
      plan.review.map((question) => question.id).join(","),
      plan.multipleChoice.map((question) => question.id).join(","),
      plan.fillInBlank.map((question) => question.id).join(","),
      plan.extraPractice.map((question) => question.id).join(","),
      plan.freeResponse?.id ?? "",
    ].join("|");
  }, [plan]);

  const [progress, setProgress] = useState<GradedLessonProgress | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!plan) return;
    const isLockedToday = (questionId: string) =>
      isQuestionLockedToday(studentScope, courseId, lessonId, questionId);
    const stored = loadGradedLessonProgress(studentScope, courseId, lessonId);
    const next = hydrateGradedProgress(stored, plan, isLockedToday);
    setProgress(next);
    setHydrated(true);
  }, [courseId, lessonId, planIdentity, studentScope]);

  const graduationThreshold = graduationThresholdForLesson(
    rubric,
    lesson?.graduationProblemCount,
  );

  const persist = useCallback(
    (next: GradedLessonProgress) => {
      setProgress(next);
      saveGradedLessonProgress(studentScope, courseId, lessonId, next);
      notifyProgressUpdated();
      const breakdown = calculateLessonScore(next, rubric);
      if (familyStudentId) {
        void syncLessonGrade({
          familyStudentId,
          courseId,
          lessonId,
          earnedPoints: breakdown.earned,
          possiblePoints: breakdown.possible,
          percent: breakdown.percent,
          problemsSolved: next.problemsSolved,
          graduated: next.graduated,
          scoreBreakdown: breakdown,
          phaseProgress: next,
        }).catch(() => undefined);
      }
    },
    [courseId, familyStudentId, lessonId, rubric, studentScope],
  );

  useEffect(() => {
    if (!progress || !plan) return;
    const isLockedToday = (questionId: string) =>
      isQuestionLockedToday(studentScope, courseId, lessonId, questionId);
    const canAccess = canAccessLessonDuringReview(
      progress,
      plan.review,
      isLockedToday,
    );
    onAccessChange?.(canAccess);
    if (plan) {
      onCompletionChange?.(
        calculateLessonCompletionPercent(progress, plan, isLockedToday),
      );
    }
  }, [courseId, lessonId, onAccessChange, onCompletionChange, planIdentity, plan, progress, studentScope]);

  if (!course || !lesson || !plan || !progress || !hydrated) {
    return <p className="text-sm text-slate-600 dark:text-stone-400">Loading lesson…</p>;
  }

  const isLockedToday = (questionId: string) =>
    isQuestionLockedToday(studentScope, courseId, lessonId, questionId);
  const reviewComplete = reviewPhaseComplete(progress, plan.review, isLockedToday);
  const reviewQuestionId = currentReviewQuestionId(
    progress,
    plan.review,
    isLockedToday,
  );
  const reviewQuestion = findQuestion(plan, reviewQuestionId);
  const mcId = currentMcQuestionId(progress);
  const fibId = currentFibQuestionId(progress);
  const extraId = currentExtraQuestionId(progress);
  const mcQuestion = findQuestion(plan, mcId);
  const fibQuestion = findQuestion(plan, fibId);
  const extraQuestion = findQuestion(plan, extraId);
  const freeResponse = plan.freeResponse;
  const lessonCompletionPercent = calculateLessonCompletionPercent(
    progress,
    plan,
    isLockedToday,
  );

  return (
    <div className="space-y-8">
      <p className="text-sm tabular-nums text-slate-600 dark:text-stone-400">
        Lesson {lessonCompletionPercent}% complete
      </p>

      {plan.review.length > 0 && progress.phase === "review" && reviewQuestion && (
        <PhaseSection
          title="Review questions"
          description={`${plan.review.length} warm-up questions before the video.`}
          progressLabel={`${progress.reviewCorrectIds.length} of ${plan.review.length} complete`}
        >
          <QuestionPanel
            key={`review-${reviewQuestion.id}`}
            studentScope={studentScope}
            courseId={courseId}
            lessonId={lessonId}
            question={reviewQuestion}
            difficulty={1}
            onSubmit={(correct) => {
              if (!correct) return;
              let next = applyReviewCorrect(
                progress,
                reviewQuestion.id,
                plan.review.length,
              );
              next = advanceAfterReview(next, plan, isLockedToday);
              persist(next);
            }}
            onHeldForToday={() => {
              let next = applyReviewHeldForToday(progress, reviewQuestion.id);
              next = advanceAfterReview(next, plan, isLockedToday);
              persist(next);
            }}
          />
        </PhaseSection>
      )}

      {reviewComplete && children}

      {reviewComplete && progress.phase === "multiple-choice" && !mcQuestion && plan.multipleChoice.length === 0 && (
        <p className="text-sm text-slate-600 dark:text-stone-400">
          No multiple-choice questions configured for this lesson.
        </p>
      )}

      {reviewComplete && progress.phase === "multiple-choice" && mcQuestion && (
        <PhaseSection
          title="Multiple choice"
          description={`Work through ${plan.multipleChoice.length} questions. Answer ${rubric.mcTargetCorrect} correctly to finish this section.`}
          progressLabel={`Question ${progress.mcIndex + 1} of ${plan.multipleChoice.length}`}
        >
          <QuestionPanel
            key={`mc-${mcQuestion.id}`}
            studentScope={studentScope}
            courseId={courseId}
            lessonId={lessonId}
            question={mcQuestion}
            difficulty={1}
            onSubmit={(correct) => {
              if (!correct) return;
              let next = applyMcResult(
                progress,
                mcQuestion.id,
                true,
                rubric,
                plan.multipleChoice.length,
              );
              next = checkGraduation(next, rubric, lesson.graduationProblemCount);
              persist(next);
            }}
            onHeldForToday={() => {
              let next = applyMcResult(
                progress,
                mcQuestion.id,
                false,
                rubric,
                plan.multipleChoice.length,
              );
              next = checkGraduation(next, rubric, lesson.graduationProblemCount);
              persist(next);
            }}
          />
        </PhaseSection>
      )}

      {reviewComplete && progress.phase === "fill-in-blank" && fibQuestion && (
        <PhaseSection
          title="Fill in the blank"
          description={`${plan.fillInBlank.length} fill-in-the-blank questions.`}
          progressLabel={`${progress.fibCorrectIds.length} of ${plan.fillInBlank.length} complete`}
        >
          <QuestionPanel
            key={`fib-${fibQuestion.id}`}
            studentScope={studentScope}
            courseId={courseId}
            lessonId={lessonId}
            question={fibQuestion}
            difficulty={1}
            onSubmit={(correct) => {
              if (!correct) return;
              let next = applyFibCorrect(
                progress,
                fibQuestion.id,
                plan.fillInBlank.length,
                plan.extraPractice.length > 0,
                Boolean(plan.freeResponse),
              );
              next = checkGraduation(next, rubric, lesson.graduationProblemCount);
              persist(next);
            }}
            onHeldForToday={() => {
              let next = applyFibHeldForToday(
                progress,
                fibQuestion.id,
                plan.fillInBlank.length,
                plan.extraPractice.length > 0,
                Boolean(plan.freeResponse),
              );
              next = checkGraduation(next, rubric, lesson.graduationProblemCount);
              persist(next);
            }}
          />
        </PhaseSection>
      )}

      {reviewComplete && progress.phase === "extra-practice" && extraQuestion && (
        <PhaseSection
          title="Review / extra practice"
          description={`${plan.extraPractice.length} mixed review questions.`}
          progressLabel={`${progress.extraCorrectIds.length} of ${plan.extraPractice.length} complete`}
        >
          <QuestionPanel
            key={`extra-${extraQuestion.id}`}
            studentScope={studentScope}
            courseId={courseId}
            lessonId={lessonId}
            question={extraQuestion}
            difficulty={2}
            skipAttemptLimits
            onSubmit={(correct) => {
              if (!correct) return;
              let next = applyExtraCorrect(
                progress,
                extraQuestion.id,
                plan.extraPractice.length,
                Boolean(plan.freeResponse),
              );
              next = checkGraduation(next, rubric, lesson.graduationProblemCount);
              persist(next);
            }}
          />
        </PhaseSection>
      )}

      {reviewComplete && progress.phase === "free-response" && freeResponse && (
        <PhaseSection
          title="Free response"
          description="Write a longer answer for your parent to review."
          progressLabel={
            progress.freeResponseSubmitted ? "Submitted for grading" : "Not submitted"
          }
        >
          <QuestionPanel
            key={`fr-${freeResponse.id}`}
            studentScope={studentScope}
            courseId={courseId}
            lessonId={lessonId}
            question={freeResponse}
            difficulty={1}
            disabled={progress.freeResponseSubmitted}
            onLongAnswerSubmit={async (answerText) => {
              if (!familyStudentId || progress.freeResponseSubmitted) return;
              const { id } = await submitLongAnswer({
                familyStudentId,
                courseId,
                lessonId,
                questionId: freeResponse.id,
                promptExcerpt: excerptPrompt(freeResponse.prompt),
                answerText,
                maxPoints: rubric.freeResponsePoints,
              });
              const next = applyFreeResponseSubmitted(progress, id);
              persist(next);
            }}
            onSubmit={(correct) => {
              if (!correct) return;
            }}
          />
        </PhaseSection>
      )}

      {progress.graduated && progress.phase !== "complete" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100">
          <p className="font-medium">
            Section graduated — you solved {progress.problemsSolved} of{" "}
            {graduationThreshold} required problems.
          </p>
        </div>
      )}

      {progress.phase === "complete" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-4 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100">
          <p className="font-medium">Lesson work complete!</p>
          {progress.freeResponseSubmitted &&
            progress.freeResponseParentScore == null && (
              <p className="mt-1">
                Your free response has been submitted and is waiting for your
                parent to review.
              </p>
            )}
        </div>
      )}
    </div>
  );
}

function PhaseSection({
  title,
  description,
  progressLabel,
  children,
}: {
  title: string;
  description: string;
  progressLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4" aria-labelledby={title}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          {title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">{description}</p>
        <p className="text-xs tabular-nums text-slate-500 dark:text-stone-500">
          {progressLabel}
        </p>
      </div>
      {children}
    </section>
  );
}
