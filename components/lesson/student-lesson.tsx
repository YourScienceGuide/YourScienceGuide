"use client";

import { useCallback, useState } from "react";

import { FlashcardReview } from "@/components/lesson/flashcard-review";
import { LessonProgress } from "@/components/lesson/lesson-progress";
import { LessonToast } from "@/components/lesson/lesson-toast";
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

  return (
    <div className="space-y-10">
      <LessonToast message={state.toast} onDismiss={dismissToast} />

      <header className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
            Today&apos;s lesson
          </h1>
          <p className="text-base text-slate-600 dark:text-stone-400">
            Answer each question to level up. Your progress saves as you go.
          </p>
        </div>
        <LessonProgress percent={percent} />
      </header>

      {state.isComplete ? (
        <div className="rounded-lg border border-sky-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900">
          <p className="text-lg font-medium text-slate-900 dark:text-stone-50">
            Lesson complete!
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-stone-400">
            You worked through all three levels. Review your flashcards below or
            revisit this lesson anytime.
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

      <FlashcardReview />
    </div>
  );
}
