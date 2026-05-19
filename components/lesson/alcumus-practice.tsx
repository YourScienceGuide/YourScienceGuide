"use client";

import { useCallback, useState } from "react";

import { LessonToast } from "@/components/lesson/lesson-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  applyAlcumusCorrect,
  applyAlcumusIncorrect,
  checkAlcumusAnswer,
  clearAlcumusToast,
  createInitialAlcumusState,
  getCurrentProblem,
  LEVEL_LABELS,
  type AlcumusState,
} from "@/lib/lesson/alcumus-machine";
import type { AlcumusLevel } from "@/lib/lesson/alcumus-problems";

export function AlcumusPractice() {
  const [state, setState] = useState<AlcumusState>(createInitialAlcumusState);
  const problem = getCurrentProblem(state);

  const dismissToast = useCallback(() => {
    setState((s) => clearAlcumusToast(s));
  }, []);

  const handleSubmit = useCallback(
    (correct: boolean) => {
      setState((s) =>
        correct ? applyAlcumusCorrect(s) : applyAlcumusIncorrect(s),
      );
    },
    [],
  );

  return (
    <section className="space-y-6">
      <LessonToast message={state.toast} onDismiss={dismissToast} />

      <div className="space-y-1">
        <h2
          id="extra-practice-heading"
          className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
        >
          Extra practice
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Optional Alcumus-style problems—separate from your lesson questions.
          Answer correctly for a harder problem; miss one and we ease the
          difficulty.
        </p>
      </div>

      <AlcumusStats state={state} />

      <AlcumusProblemCard
        key={problem.id}
        problem={problem}
        level={state.level}
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

function AlcumusProblemCard({
  problem,
  level,
  feedback,
  feedbackTone,
  onSubmit,
}: {
  problem: ReturnType<typeof getCurrentProblem>;
  level: AlcumusLevel;
  feedback: string | null;
  feedbackTone: "success" | "retry" | null;
  onSubmit: (correct: boolean) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");

  function handleCheck() {
    const correct =
      problem.type === "choice"
        ? checkAlcumusAnswer(problem, { selectedIndex })
        : checkAlcumusAnswer(problem, { text: textAnswer });
    onSubmit(correct);
    if (!correct) return;
    setSelectedIndex(null);
    setTextAnswer("");
  }

  return (
    <article className="space-y-5 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
      <p className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
        Level {level} · {LEVEL_LABELS[level]}
      </p>
      <p className="text-base font-medium leading-relaxed text-slate-900 dark:text-stone-50">
        {problem.prompt}
      </p>

      {problem.type === "choice" && problem.options && (
        <fieldset className="space-y-2">
          <legend className="sr-only">Select an answer</legend>
          {problem.options.map((option, index) => (
            <label
              key={option}
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
              <span className="text-slate-800 dark:text-stone-200">{option}</span>
            </label>
          ))}
        </fieldset>
      )}

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

      {problem.hint && (
        <p className="text-xs text-slate-500 dark:text-stone-500">
          Hint: {problem.hint}
        </p>
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
