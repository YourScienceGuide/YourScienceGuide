"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { LessonNav } from "@/components/student/lesson-nav";
import { RequiredReadings } from "@/components/student/required-readings";
import { notifyProgressUpdated } from "@/components/student/use-course-progress";
import { getLessonReadings, getTextbook } from "@/lib/student/textbook";
import { useLessonAssessment } from "@/components/lesson/lesson-assessment-provider";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import { LessonToast } from "@/components/lesson/lesson-toast";
import { LessonVideo } from "@/components/lesson/lesson-video";
import { QuestionPanel } from "@/components/lesson/question-panel";
import { Button } from "@/components/ui/button";
import {
  getAdjacentLessons,
  getCourse,
  getLesson,
} from "@/lib/student/curriculum";
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
  applyIncorrectAnswer,
  clearToast,
  INITIAL_LESSON_STATE,
  progressPercent,
  type LessonMachineState,
} from "@/lib/lesson/state-machine";
import { lessonStepLabel } from "@/lib/lesson/progress-labels";

type StudentLessonProps = {
  courseId: string;
  lessonId: string;
};

export function StudentLesson({ courseId, lessonId }: StudentLessonProps) {
  const course = getCourse(courseId);
  const lessonMeta = getLesson(courseId, lessonId);
  const textbook = getTextbook(courseId);
  const readings = getLessonReadings(lessonId);
  const { prev, next } = getAdjacentLessons(courseId, lessonId);

  const { lesson, ready, error } = useLessonAssessment();
  const [state, setState] = useState<LessonMachineState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadLessonProgress(courseId, lessonId);
    const restored = storedToMachineState(stored);
    setState(restored ? { ...INITIAL_LESSON_STATE, ...restored } : INITIAL_LESSON_STATE);
    setHydrated(true);
  }, [courseId, lessonId]);

  useEffect(() => {
    if (!state || !hydrated) return;
    saveLessonProgress(courseId, lessonId, state);
    notifyProgressUpdated();
  }, [courseId, lessonId, state, hydrated]);

  const dismissToast = useCallback(() => {
    setState((s) => (s ? clearToast(s) : s));
  }, []);

  const handleAnswer = useCallback((correct: boolean) => {
    setState((s) => {
      if (!s) return s;
      return correct ? applyCorrectAnswer(s) : applyIncorrectAnswer(s);
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

  if (!ready || !state) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading lesson…
      </p>
    );
  }

  const currentQuestion = lesson[state.questionIndex];
  if (!currentQuestion) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading lesson…
      </p>
    );
  }

  const percent = progressPercent(state);
  const stepLabel = lessonStepLabel(state.questionIndex, state.isComplete);

  return (
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
        Complete the required readings, watch the video, then finish all three
        assignment parts below. Extra Practice and Flashcard Review are optional.
      </p>

      {textbook && readings.length > 0 && (
        <RequiredReadings textbook={textbook} readings={readings} />
      )}

      <LessonVideo />

      <section className="space-y-6" aria-labelledby="lesson-questions-heading">
        <div className="space-y-1">
          <h2
            id="lesson-questions-heading"
            className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
          >
            Your assignment
          </h2>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            Complete all three parts in order.
          </p>
        </div>

        {state.isComplete ? (
          <div className="rounded-lg border border-sky-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900">
            <p className="text-lg font-medium text-slate-900 dark:text-stone-50">
              Lesson complete!
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-stone-400">
              You finished all three lesson questions. Try Extra Practice or
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
        ) : (
          <QuestionPanel
            key={currentQuestion.id}
            question={currentQuestion}
            difficulty={state.difficulty}
            feedback={state.feedback}
            feedbackTone={state.feedbackTone}
            disabled={false}
            onSubmit={handleAnswer}
          />
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
              Optional adaptive problems—separate from your lesson questions,
              with its own mastery progress.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href={lessonPracticePath(courseId, lessonId)}>Extra Practice</Link>
          </Button>
        </div>
      </section>

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
  );
}
