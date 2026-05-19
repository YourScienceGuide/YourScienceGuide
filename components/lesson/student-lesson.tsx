"use client";

import { useCallback, useState } from "react";

import { AlcumusPractice } from "@/components/lesson/alcumus-practice";
import { FlashcardReview } from "@/components/lesson/flashcard-review";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import { LessonToast } from "@/components/lesson/lesson-toast";
import { LessonVideo } from "@/components/lesson/lesson-video";
import { QuestionPanel } from "@/components/lesson/question-panel";
import { LESSON_QUESTIONS } from "@/lib/lesson/questions";
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
  const [state, setState] = useState<LessonMachineState>(INITIAL_LESSON_STATE);

  const currentQuestion = LESSON_QUESTIONS[state.questionIndex];
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

  return (
    <div className="space-y-10">
      <LessonToast message={state.toast} onDismiss={dismissToast} />

      <LessonProgressRail percent={percent} stepLabel={stepLabel} />

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Today&apos;s lesson
        </h1>
        <p className="text-base text-slate-600 dark:text-stone-400">
          Watch the video, then work through the three lesson questions. Extra
          adaptive practice below is optional.
        </p>
      </header>

      <LessonVideo />

      <section className="space-y-6" aria-labelledby="lesson-questions-heading">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2
              id="lesson-questions-heading"
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
            >
              Lesson questions
            </h2>
            <p className="text-sm text-slate-600 dark:text-stone-400">
              Your main assignment: multiple choice, short answer, and a
              long-answer response for parent review.
            </p>
          </div>
        </div>

        {state.isComplete ? (
          <div className="rounded-lg border border-sky-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900">
            <p className="text-lg font-medium text-slate-900 dark:text-stone-50">
              Lesson complete!
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-stone-400">
              You finished all three lesson questions. Try extra practice below
              or review your flashcards.
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
        className="border-t border-sky-200 pt-10 dark:border-stone-700"
        aria-labelledby="extra-practice-heading"
      >
        <AlcumusPractice />
      </section>

      <FlashcardReview />
    </div>
  );
}
