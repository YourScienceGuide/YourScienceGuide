"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useContentStore } from "@/components/admin/content-store-provider";
import { useStudentScope } from "@/components/student/use-student-scope";
import { GuestLessonGuard } from "@/components/guest/guest-lesson-guard";
import { LessonNav } from "@/components/student/lesson-nav";
import { RequiredReadings } from "@/components/student/required-readings";
import { QuestionHistorySection } from "@/components/student/question-history-section";
import { useQuestionAttemptRecorder } from "@/components/student/use-question-attempt-recorder";
import { notifyProgressUpdated } from "@/components/student/use-course-progress";
import {
  getAdjacentLessonsClient,
  getCourseClient,
  getLessonClient,
  getTextbookClient,
} from "@/lib/student/curriculum-client";
import { getLessonReadings } from "@/lib/student/textbook";
import { useLessonAssessment } from "@/components/lesson/lesson-assessment-provider";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import { LessonToast } from "@/components/lesson/lesson-toast";
import { LessonVideo } from "@/components/lesson/lesson-video";
import { QuestionPanel } from "@/components/lesson/question-panel";
import { Button } from "@/components/ui/button";
import {
  loadLessonProgress,
  saveLessonProgress,
  storedToMachineState,
} from "@/lib/student/lesson-progress";
import {
  lessonFlashcardsPath,
  lessonPath,
  lessonPracticePath,
} from "@/lib/student/paths";
import {
  applyCorrectAnswer,
  clearToast,
  INITIAL_LESSON_STATE,
  progressPercent,
  withAssignmentCount,
  type LessonMachineState,
} from "@/lib/lesson/state-machine";
import { lessonStepLabel } from "@/lib/lesson/progress-labels";
import {
  GUEST_LESSON_LIMIT,
  recordGuestLessonComplete,
} from "@/lib/guest/guest-progress";

type StudentLessonProps = {
  courseId: string;
  lessonId: string;
};

export function StudentLesson({ courseId, lessonId }: StudentLessonProps) {
  const { isGuest, openSignupModal } = useAuth();
  const studentScope = useStudentScope();
  const { store } = useContentStore();
  const guestCompletionRecorded = useRef(false);
  const course = getCourseClient(store, courseId);
  const lessonMeta = getLessonClient(store, courseId, lessonId);
  const textbook = getTextbookClient(store, courseId);
  const readings = getLessonReadings(lessonId);
  const { prev, next } = getAdjacentLessonsClient(store, courseId, lessonId);

  const { lesson, practice, ready, error } = useLessonAssessment();
  const { recordAssignmentAttempt } = useQuestionAttemptRecorder(courseId, lessonId);
  const [state, setState] = useState<LessonMachineState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!ready || !studentScope) return;
    guestCompletionRecorded.current = false;
    const stored = loadLessonProgress(studentScope, courseId, lessonId);
    const restored = storedToMachineState(stored);
    const base = restored ? { ...INITIAL_LESSON_STATE, ...restored } : INITIAL_LESSON_STATE;
    setState(withAssignmentCount(base, lesson.length));
    setHydrated(true);
  }, [courseId, lessonId, ready, studentScope, lesson.length]);

  useEffect(() => {
    if (!state || !hydrated || !studentScope) return;
    saveLessonProgress(studentScope, courseId, lessonId, state);
    notifyProgressUpdated();
  }, [courseId, lessonId, state, hydrated, studentScope]);

  useEffect(() => {
    if (!isGuest || !hydrated || !state?.isComplete) return;
    if (guestCompletionRecorded.current) return;
    guestCompletionRecorded.current = true;
    const count = recordGuestLessonComplete(courseId, lessonId);
    if (count >= GUEST_LESSON_LIMIT) {
      openSignupModal("limit");
    }
  }, [
    isGuest,
    hydrated,
    state?.isComplete,
    courseId,
    lessonId,
    openSignupModal,
  ]);

  const dismissToast = useCallback(() => {
    setState((s) => (s ? clearToast(s) : s));
  }, []);

  const handleAnswer = useCallback((correct: boolean) => {
    if (!correct) return;
    setState((s) => {
      if (!s) return s;
      return applyCorrectAnswer(s);
    });
  }, []);

  if (!course || !lessonMeta) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        This lesson could not be found.
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  if (!ready || !state || !studentScope) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading lesson…
      </p>
    );
  }

  const hasAssignment = lesson.length > 0;
  const hasExtraPractice = practice.length > 0;
  const currentQuestion = hasAssignment ? lesson[state.questionIndex] : undefined;

  const percent = hasAssignment ? progressPercent(state) : 0;
  const stepLabel = hasAssignment
    ? lessonStepLabel(state.questionIndex, state.assignmentCount, state.isComplete)
    : "No assignment questions";

  return (
    <GuestLessonGuard courseId={courseId} lessonId={lessonId}>
    <div className="space-y-10">
      <LessonToast message={state.toast} onDismiss={dismissToast} />

      <LessonProgressRail percent={percent} stepLabel={stepLabel} />

      <LessonNav
        courseId={courseId}
        courseTitle={course.title}
        lesson={lessonMeta}
        prev={prev}
        next={next}
      />

      <p className="text-base text-slate-600 dark:text-stone-400">
        {hasAssignment
          ? "Complete the required readings, watch the video, then finish all assignment parts below. Extra Practice and Flashcard Review are optional."
          : "Complete the required readings and watch the video. Extra Practice and Flashcard Review are optional when available."}
      </p>

      {textbook && readings.length > 0 && (
        <RequiredReadings textbook={textbook} readings={readings} />
      )}

      <LessonVideo courseId={courseId} lessonId={lessonId} />

      <section className="space-y-6" aria-labelledby="lesson-questions-heading">
        <div className="space-y-1">
          <h2
            id="lesson-questions-heading"
            className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
          >
            Your assignment
          </h2>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            {hasAssignment
              ? "Complete all parts in order."
              : "Assignment questions have not been added yet."}
          </p>
        </div>

        {!hasAssignment ? (
          <p className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400">
            No assignment questions for this section.
          </p>
        ) : state.isComplete ? (
          <div className="rounded-lg border border-sky-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900">
            <p className="text-lg font-medium text-slate-900 dark:text-stone-50">
              Lesson complete!
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-stone-400">
              You finished all {state.assignmentCount} assignment question
              {state.assignmentCount === 1 ? "" : "s"}. Try Extra Practice or
              Flashcard Review, or continue to the next lesson.
            </p>
            {next && (
              <Button asChild className="mt-4">
                <Link href={lessonPath(courseId, next.id)}>
                  Next lesson: {next.title}
                </Link>
              </Button>
            )}
          </div>
        ) : currentQuestion ? (
          <QuestionPanel
            key={`${studentScope}-${currentQuestion.id}`}
            studentScope={studentScope}
            courseId={courseId}
            lessonId={lessonId}
            question={currentQuestion}
            difficulty={state.difficulty}
            disabled={false}
            onSubmit={handleAnswer}
            onAnswerChecked={(result) => {
              void recordAssignmentAttempt(result);
            }}
          />
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            Assignment questions could not be loaded. Please refresh the page.
          </p>
        )}
      </section>

      <section
        className="rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900"
        aria-labelledby="extra-practice-heading"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2
              id="extra-practice-heading"
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
            >
              Extra Practice
            </h2>
            <p className="text-sm text-slate-600 dark:text-stone-400">
              {hasExtraPractice
                ? "Optional harder problems from this chapter—leftover easy questions plus challenge items, with adaptive difficulty."
                : "Extra practice has not been added for this section yet."}
            </p>
          </div>
          {hasExtraPractice ? (
            <Button asChild className="shrink-0">
              <Link href={lessonPracticePath(courseId, lessonId)}>Extra Practice</Link>
            </Button>
          ) : (
            <p className="text-sm text-slate-600 dark:text-stone-400 sm:text-right">
              No extra practice problems for this section.
            </p>
          )}
        </div>
      </section>

      <QuestionHistorySection
        courseId={courseId}
        lessonId={lessonId}
        title="Your question history"
        description="Assignment and extra practice attempts for this lesson."
      />

      <section
        className="rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900"
        aria-labelledby="flashcard-review-heading"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2
              id="flashcard-review-heading"
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
            >
              Flashcard Review
            </h2>
            <p className="text-sm text-slate-600 dark:text-stone-400">
              Anki-style spaced repetition—rate cards after you reveal each
              answer, with its own mastery progress.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href={lessonFlashcardsPath(courseId, lessonId)}>
              Flashcard Review
            </Link>
          </Button>
        </div>
      </section>
    </div>
    </GuestLessonGuard>
  );
}
