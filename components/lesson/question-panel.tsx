"use client";

import { useMemo, useState } from "react";

import { AssessmentProtected } from "@/components/ai-guard/assessment-protected";
import { CanvasText } from "@/components/ai-guard/canvas-text";
import { Button } from "@/components/ui/button";
import { toDisplayEncoding } from "@/lib/ai-guard/encode";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/lesson/state-machine";
import { shuffleMultipleChoice } from "@/lib/lesson/shuffle-multiple-choice";
import type { LessonQuestion } from "@/lib/lesson/types";
import { validateAnswer } from "@/lib/lesson/validate-answer";

type QuestionPanelProps = {
  question: LessonQuestion;
  difficulty: Difficulty;
  feedback: string | null;
  feedbackTone: "success" | "retry" | null;
  disabled: boolean;
  onSubmit: (correct: boolean) => void;
};

export function QuestionPanel({
  question,
  difficulty,
  feedback,
  feedbackTone,
  disabled,
  onSubmit,
}: QuestionPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [longAnswer, setLongAnswer] = useState("");
  const [parentSubmitted, setParentSubmitted] = useState(false);

  const shuffledMc = useMemo(
    () =>
      question.type === "multiple-choice"
        ? shuffleMultipleChoice(question)
        : null,
    [question],
  );

  const questionForValidation = useMemo(() => {
    if (question.type !== "multiple-choice" || !shuffledMc) return question;
    return { ...question, ...shuffledMc };
  }, [question, shuffledMc]);

  function handleCheck(
    payload: { selectedIndex?: number | null; text?: string },
  ) {
    const correct = validateAnswer(questionForValidation, payload);
    onSubmit(correct);
  }

  function resetInputs() {
    setSelectedIndex(null);
    setTextAnswer("");
    setLongAnswer("");
    setParentSubmitted(false);
  }

  const mcOptions = shuffledMc?.options ?? [];

  return (
    <article
      className="space-y-6 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900"
      data-question-slot={difficulty}
    >
      <AssessmentProtected className="space-y-6">
        <CanvasText
          encoded={toDisplayEncoding(question.prompt)}
          variant="prompt"
        />

        {question.type === "multiple-choice" && (
          <fieldset className="space-y-2" disabled={disabled}>
            <legend className="sr-only">Select a response</legend>
            {mcOptions.map((option, index) => (
              <label
                key={`${question.id}-${index}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors",
                  selectedIndex === index
                    ? "border-sky-400 bg-sky-50 dark:border-stone-500 dark:bg-stone-800"
                    : "border-sky-100 hover:bg-sky-50/80 dark:border-stone-700 dark:hover:bg-stone-800/80",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                <input
                  type="radio"
                  name={`mc-${question.id}`}
                  className="size-4 shrink-0 accent-sky-600"
                  checked={selectedIndex === index}
                  onChange={() => setSelectedIndex(index)}
                  aria-label={`Response ${index + 1}`}
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
      </AssessmentProtected>

      {question.type === "short-answer" && (
        <div className="space-y-2">
          <label htmlFor="short-answer" className="sr-only">
            Your answer
          </label>
          <input
            id="short-answer"
            type="text"
            inputMode="decimal"
            placeholder="Enter your answer"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={disabled}
            className="w-full rounded-md border border-sky-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
          />
        </div>
      )}

      {question.type === "long-answer" && (
        <div className="space-y-2">
          <label htmlFor="long-answer" className="sr-only">
            Your explanation
          </label>
          <textarea
            id="long-answer"
            rows={5}
            value={longAnswer}
            onChange={(e) => setLongAnswer(e.target.value)}
            disabled={disabled || parentSubmitted}
            placeholder="Write your explanation here..."
            className="w-full resize-y rounded-md border border-sky-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
          />
          {parentSubmitted && (
            <p className="text-sm text-sky-700 dark:text-stone-300">
              Sent to your parent for review. Great work explaining your thinking!
            </p>
          )}
        </div>
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

      <div className="flex flex-wrap gap-3">
        {question.type === "long-answer" ? (
          <Button
            type="button"
            disabled={disabled || parentSubmitted}
            onClick={() => {
              const correct = validateAnswer(questionForValidation, {
                text: longAnswer,
              });
              if (correct) setParentSubmitted(true);
              onSubmit(correct);
            }}
          >
            Submit for Parent Review
          </Button>
        ) : (
          <Button
            type="button"
            disabled={
              disabled ||
              (question.type === "multiple-choice" && selectedIndex === null) ||
              (question.type === "short-answer" && textAnswer.trim() === "")
            }
            onClick={() => {
              if (question.type === "multiple-choice") {
                handleCheck({ selectedIndex });
              } else {
                handleCheck({ text: textAnswer });
              }
            }}
          >
            Check answer
          </Button>
        )}
        {!disabled && (
          <Button type="button" variant="ghost" onClick={resetInputs}>
            Clear
          </Button>
        )}
      </div>
    </article>
  );
}
