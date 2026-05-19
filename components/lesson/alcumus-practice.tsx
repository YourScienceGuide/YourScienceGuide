"use client";

import { useCallback, useMemo, useState } from "react";

import { AssessmentProtected } from "@/components/ai-guard/assessment-protected";
import { CanvasText } from "@/components/ai-guard/canvas-text";
import { useLessonAssessment } from "@/components/lesson/lesson-assessment-provider";
import { LessonToast } from "@/components/lesson/lesson-toast";
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
  state: AlcumusState;
  onStateChange: (state: AlcumusState) => void;
};

export function AlcumusPractice({ state, onStateChange }: AlcumusPracticeProps) {
  const { alcumus } = useLessonAssessment();

  const dismissToast = useCallback(() => {
    onStateChange(clearAlcumusToast(state));
  }, [onStateChange, state]);

  const handleSubmit = useCallback(
    (correct: boolean) => {
      onStateChange(
        correct
          ? applyAlcumusCorrect(alcumus, state)
          : applyAlcumusIncorrect(alcumus, state),
      );
    },
    [alcumus, onStateChange, state],
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
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors",
                  selectedIndex === index
                    ? "border-sky-400 bg-sky-50 dark:border-stone-500 dark:bg-stone-800"
                    : "border-sky-100 hover:bg-sky-50/80 dark:border-stone-700 dark:hover:bg-stone-800/80",
                )}
              >
                <input
                  type="radio"
                  name={`alcumus-${problem.id}`}
                  className="size-4 accent-sky-600"
                  checked={selectedIndex === index}
                  onChange={() => setSelectedIndex(index)}
                />
                <CanvasText
                  encoded={toDisplayEncoding(option)}
                  variant="option"
                  className="min-w-0 flex-1"
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
