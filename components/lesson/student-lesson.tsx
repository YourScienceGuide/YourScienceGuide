"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { FlashcardReview } from "@/components/lesson/flashcard-review";
import { useLessonAssessment } from "@/components/lesson/lesson-assessment-provider";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import { LessonToast } from "@/components/lesson/lesson-toast";
import { LessonVideo } from "@/components/lesson/lesson-video";
import { QuestionPanel } from "@/components/lesson/question-panel";
import { Button } from "@/components/ui/button";
import {
  applyCorrectAnswer,
  applyIncorrectAnswer,
  clearToast,
  INITIAL_LESSON_STATE,
  progressPercent,
  type LessonMachineState,
} from "@/lib/lesson/state-machine";
import { lessonStepLabel } from "@/lib/lesson/progress-labels";

export function StudentLesson() {
  const { lesson, ready, error } = useLessonAssessment();
  const [state, setState] = useState<LessonMachineState>(INITIAL_LESSON_STATE);

  const currentQuestion = lesson[state.questionIndex];
  const percent = progressPercent(state);

  const dismissToast = useCallback(() => {
    setState((s) => clearToast(s));
  }, []);

  const handleAnswer = useCallback((correct: boolean) => {
    setState((s) =>
      correct ? applyCorrectAnswer(s) : applyIncorrectAnswer(s),
    );
  }, []);

  const stepLabel = lessonStepLabel(state.questionIndex, state.isComplete);

  if (error) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  if (!ready || !currentQuestion) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading lesson…
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <LessonToast message={state.toast} onDismiss={dismissToast} />

      <LessonProgressRail percent={percent} stepLabel={stepLabel} />

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Today&apos;s lesson
        </h1>
        <p className="text-base text-slate-600 dark:text-stone-400">
          Watch the video, then complete all three parts below. Extra Practice
          is optional and opens on its own page.
        </p>
      </header>

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
              review your flashcards.
            </p>
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
            <Link href="/lesson/practice">Extra Practice</Link>
          </Button>
        </div>
      </section>

      <FlashcardReview />
    </div>
  );
}
