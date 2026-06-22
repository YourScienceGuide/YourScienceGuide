"use client";

import { useCallback } from "react";

import { useLessonAssessment } from "@/components/lesson/lesson-assessment-provider";
import { LessonToast } from "@/components/lesson/lesson-toast";
import { QuestionPanel } from "@/components/lesson/question-panel";
import { useQuestionAttemptRecorder } from "@/components/student/use-question-attempt-recorder";
import { cn } from "@/lib/utils";
import {
  applyAlcumusCorrect,
  applyAlcumusIncorrect,
  clearAlcumusToast,
  getCurrentProblem,
  LEVEL_LABELS,
  type AlcumusState,
} from "@/lib/lesson/alcumus-machine";
import type { AlcumusLevel } from "@/lib/lesson/alcumus-types";

type AlcumusPracticeProps = {
  courseId: string;
  lessonId: string;
  state: AlcumusState;
  onStateChange: (state: AlcumusState) => void;
};

export function AlcumusPractice({
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
      onStateChange(applyAlcumusCorrect(practice, state));
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

  return (
    <section className="space-y-6" aria-label="Extra practice problems">
      <LessonToast message={state.toast} onDismiss={dismissToast} />

      <AlcumusStats state={state} />

      <QuestionPanel
        key={problem.id}
        courseId={courseId}
        lessonId={lessonId}
        question={problem}
        difficulty={Math.min(3, problem.difficulty) as 1 | 2 | 3}
        skipAttemptLimits
        disabled={false}
        onSubmit={handleSubmit}
        onAnswerChecked={handleAnswerChecked}
      />
    </section>
  );
}

function AlcumusStats({ state }: { state: AlcumusState }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatPill label="Difficulty" value={LEVEL_LABELS[state.level]} />
      <StatPill label="Streak" value={String(state.streak)} />
      <StatPill label="Solved" value={String(state.solved)} />
      <div className="sm:col-span-3">
        <DifficultyMeter level={state.level} />
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-sky-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-900">
      <p className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-stone-50">
        {value}
      </p>
    </div>
  );
}

function DifficultyMeter({ level }: { level: AlcumusLevel }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600 dark:text-stone-400">
        Difficulty ramp · Level {level} of 5
      </p>
      <div className="flex gap-1">
        {([1, 2, 3, 4, 5] as AlcumusLevel[]).map((step) => (
          <div
            key={step}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              step <= level
                ? "bg-sky-600 dark:bg-stone-200"
                : "bg-sky-100 dark:bg-stone-800",
            )}
          />
        ))}
      </div>
    </div>
  );
}
