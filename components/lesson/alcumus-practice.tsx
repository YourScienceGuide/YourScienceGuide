"use client";

import { useCallback, useMemo, useState } from "react";

import { AssessmentProtected } from "@/components/ai-guard/assessment-protected";
import { CanvasText } from "@/components/ai-guard/canvas-text";
import { useLessonAssessment } from "@/components/lesson/lesson-assessment-provider";
import { LessonToast } from "@/components/lesson/lesson-toast";
import { useQuestionAttemptRecorder } from "@/components/student/use-question-attempt-recorder";
import { Button } from "@/components/ui/button";
import { toDisplayEncoding } from "@/lib/ai-guard/encode";
import { cn } from "@/lib/utils";
import {
  applyAlcumusCorrect,
  applyAlcumusIncorrect,
  checkAlcumusAnswer,
  clearAlcumusToast,
  getCurrentProblem,
  LEVEL_LABELS,
  type AlcumusState,
} from "@/lib/lesson/alcumus-machine";
import type { AlcumusLevel, AlcumusProblem } from "@/lib/lesson/alcumus-types";
import { shuffleMultipleChoice } from "@/lib/lesson/shuffle-multiple-choice";
import type { MultipleChoiceQuestion } from "@/lib/lesson/types";

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
  const { alcumus } = useLessonAssessment();
  const { recordAlcumusAttempt } = useQuestionAttemptRecorder(courseId, lessonId);

  const dismissToast = useCallback(() => {
    onStateChange(clearAlcumusToast(state));
  }, [onStateChange, state]);

  const handleSubmit = useCallback(
    (correct: boolean) => {
      const problem = getCurrentProblem(alcumus, state);
      void recordAlcumusAttempt({
        questionId: problem.id,
        questionType: problem.type,
        prompt: problem.prompt,
        isCorrect: correct,
      });
      onStateChange(
        correct
          ? applyAlcumusCorrect(alcumus, state)
          : applyAlcumusIncorrect(alcumus, state),
      );
    },
    [alcumus, onStateChange, recordAlcumusAttempt, state],
  );

  const problem = getCurrentProblem(alcumus, state);

  return (
    <section className="space-y-6" aria-label="Extra practice problems">
      <LessonToast message={state.toast} onDismiss={dismissToast} />

      <AlcumusStats state={state} />

      <AlcumusProblemCard
        key={problem.id}
        problem={problem}
        feedback={state.feedback}
        feedbackTone={state.feedbackTone}
        onSubmit={handleSubmit}
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
          <MeterStep key={step} level={level} step={step} />
        ))}
      </div>
    </div>
  );
}

function MeterStep({ level, step }: { level: AlcumusLevel; step: AlcumusLevel }) {
  return (
    <div
      className={cn(
        "h-2 flex-1 rounded-full transition-colors",
        step <= level
          ? "bg-sky-600 dark:bg-stone-200"
          : "bg-sky-100 dark:bg-stone-800",
      )}
    />
  );
}

function AlcumusProblemCard({
  problem,
  feedback,
  feedbackTone,
  onSubmit,
}: {
  problem: AlcumusProblem;
  feedback: string | null;
  feedbackTone: "success" | "retry" | null;
  onSubmit: (correct: boolean) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");

  const choiceAsMc = useMemo((): MultipleChoiceQuestion | null => {
    if (problem.type !== "choice" || !problem.options) return null;
    return {
      type: "multiple-choice",
      id: "q1",
      prompt: problem.prompt,
      options: problem.options,
      correctIndex: problem.correctIndex ?? 0,
    };
  }, [problem]);

  const shuffled = useMemo(
    () => (choiceAsMc ? shuffleMultipleChoice(choiceAsMc) : null),
    [choiceAsMc],
  );

  const problemForCheck = useMemo(() => {
    if (problem.type !== "choice" || !shuffled) return problem;
    return { ...problem, options: shuffled.options, correctIndex: shuffled.correctIndex };
  }, [problem, shuffled]);

  function handleCheck() {
    const correct =
      problem.type === "choice"
        ? checkAlcumusAnswer(problemForCheck, { selectedIndex })
        : checkAlcumusAnswer(problem, { text: textAnswer });
    onSubmit(correct);
    if (!correct) return;
    setSelectedIndex(null);
    setTextAnswer("");
  }

  const options = shuffled?.options ?? problem.options ?? [];

  return (
    <article className="space-y-5 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
      <AssessmentProtected className="space-y-5">
        <CanvasText
          encoded={toDisplayEncoding(problem.prompt)}
          variant="prompt"
        />

        {problem.type === "choice" && (
          <fieldset className="space-y-2">
            <legend className="sr-only">Select a response</legend>
            {options.map((option, index) => (
              <label
                key={`${problem.id}-${index}`}
                className="flex cursor-pointer items-start gap-3"
              >
                <input
                  type="radio"
                  name={`alcumus-${problem.id}`}
                  className="mt-3 size-4 shrink-0 accent-sky-600"
                  checked={selectedIndex === index}
                  onChange={() => setSelectedIndex(index)}
                />
                <CanvasText
                  encoded={toDisplayEncoding(option)}
                  variant="option"
                  className={cn(
                    "min-w-0 flex-1",
                    selectedIndex === index &&
                      "border-amber-400 ring-2 ring-amber-300/80 dark:border-amber-600 dark:ring-amber-700/50",
                  )}
                />
              </label>
            ))}
          </fieldset>
        )}

        {problem.hint && (
          <div className="text-xs text-slate-500 dark:text-stone-500">
            <span className="sr-only">Hint</span>
            <CanvasText
              encoded={toDisplayEncoding(`Hint: ${problem.hint}`)}
              variant="option"
            />
          </div>
        )}
      </AssessmentProtected>

      {problem.type === "numeric" && (
        <input
          type="text"
          inputMode="decimal"
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder="Enter your answer"
          className="w-full rounded-md border border-sky-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
        />
      )}

      {feedback && (
        <p
          role="alert"
          className={cn(
            "text-sm font-medium",
            feedbackTone === "retry"
              ? "text-amber-700 dark:text-amber-300"
              : "text-emerald-700 dark:text-emerald-300",
          )}
        >
          {feedback}
        </p>
      )}

      <Button
        type="button"
        disabled={
          problem.type === "choice"
            ? selectedIndex === null
            : textAnswer.trim() === ""
        }
        onClick={handleCheck}
      >
        Submit answer
      </Button>
    </article>
  );
}
