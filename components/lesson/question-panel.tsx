"use client";

import { useEffect, useMemo, useState } from "react";

import { AssessmentProtected } from "@/components/ai-guard/assessment-protected";
import { CanvasText } from "@/components/ai-guard/canvas-text";
import { Button } from "@/components/ui/button";
import { toDisplayEncoding } from "@/lib/ai-guard/encode";
import {
  countBlanks,
  FILL_IN_BLANK_SPELLING_HINT,
  splitPromptOnBlanks,
} from "@/lib/lesson/fill-in-blank";
import {
  afterQuestionAttempt,
  attemptsRemaining,
  getMaxAttempts,
} from "@/lib/lesson/question-attempt-limits";
import {
  getQuestionHint,
  LOCKED_UNTIL_TOMORROW_MESSAGE,
} from "@/lib/lesson/question-hint";
import { shuffleMultipleChoice } from "@/lib/lesson/shuffle-multiple-choice";
import type { Difficulty } from "@/lib/lesson/state-machine";
import type { LessonQuestion } from "@/lib/lesson/types";
import { checkFillInBlank, validateAnswer } from "@/lib/lesson/validate-answer";
import {
  getResolvedQuestionAttemptState,
  loadQuestionAttemptRecord,
  saveQuestionAttemptRecord,
} from "@/lib/student/question-attempt-state";
import { cn } from "@/lib/utils";

type QuestionPanelProps = {
  studentScope: string;
  courseId: string;
  lessonId: string;
  question: LessonQuestion;
  difficulty: Difficulty;
  disabled?: boolean;
  /** Extra practice skips per-day attempt limits. */
  skipAttemptLimits?: boolean;
  onSubmit: (correct: boolean) => void;
  /** Called when this question is held until tomorrow after exhausting tries. */
  onHeldForToday?: () => void;
  onAnswerChecked?: (result: {
    questionId: string;
    questionType: string;
    prompt: string;
    isCorrect: boolean;
  }) => void;
};

export function QuestionPanel({
  studentScope,
  courseId,
  lessonId,
  question,
  difficulty,
  disabled: disabledExternal = false,
  skipAttemptLimits = false,
  onSubmit,
  onHeldForToday,
  onAnswerChecked,
}: QuestionPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [longAnswer, setLongAnswer] = useState("");
  const [blankAnswers, setBlankAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "retry" | null>(
    null,
  );
  const [parentSubmitted, setParentSubmitted] = useState(false);
  const [attemptVersion, setAttemptVersion] = useState(0);

  const maxAttempts = skipAttemptLimits ? null : getMaxAttempts(question);
  const limited = maxAttempts !== null;

  const attemptState = useMemo(() => {
    void attemptVersion;
    if (!limited) return { attemptsUsed: 0, isLocked: false };
    return getResolvedQuestionAttemptState(
      studentScope,
      courseId,
      lessonId,
      question.id,
    );
  }, [attemptVersion, studentScope, courseId, lessonId, limited, question.id]);

  const isLocked = limited && attemptState.isLocked;
  const disabled = disabledExternal || isLocked;
  const remaining = limited
    ? attemptsRemaining(attemptState.attemptsUsed, maxAttempts)
    : null;

  const blankCount =
    question.type === "fill-in-the-blank" ? countBlanks(question.prompt) : 0;
  const promptParts =
    question.type === "fill-in-the-blank"
      ? splitPromptOnBlanks(question.prompt)
      : [];

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

  useEffect(() => {
    setSelectedIndex(null);
    setTextAnswer("");
    setLongAnswer("");
    setBlankAnswers(Array(blankCount).fill(""));
    setFeedback(null);
    setFeedbackTone(null);
    setParentSubmitted(false);
    setAttemptVersion((v) => v + 1);
  }, [question.id, blankCount]);

  function notifyChecked(isCorrect: boolean) {
    onAnswerChecked?.({
      questionId: question.id,
      questionType: question.type,
      prompt: question.prompt,
      isCorrect,
    });
  }

  function handleWrongAnswer(message: string, countsAsAttempt = true) {
    if (countsAsAttempt && limited) {
      const previous = loadQuestionAttemptRecord(
        studentScope,
        courseId,
        lessonId,
        question.id,
      );
      const next = afterQuestionAttempt(previous, maxAttempts, false);
      saveQuestionAttemptRecord(
        studentScope,
        courseId,
        lessonId,
        question.id,
        next,
      );
      setAttemptVersion((v) => v + 1);

      if (next.exhaustedOnDay) {
        setFeedback(LOCKED_UNTIL_TOMORROW_MESSAGE);
        setFeedbackTone("retry");
        notifyChecked(false);
        onHeldForToday?.();
        return;
      }
    }

    setFeedback(message);
    setFeedbackTone("retry");
    notifyChecked(false);
  }

  function handleCorrectAnswer() {
    if (limited) {
      const previous = loadQuestionAttemptRecord(
        studentScope,
        courseId,
        lessonId,
        question.id,
      );
      const next = afterQuestionAttempt(previous, maxAttempts, true);
      saveQuestionAttemptRecord(
        studentScope,
        courseId,
        lessonId,
        question.id,
        next,
      );
      setAttemptVersion((v) => v + 1);
    }
    setFeedback(null);
    setFeedbackTone(null);
    notifyChecked(true);
    onSubmit(true);
  }

  function resetInputs() {
    setSelectedIndex(null);
    setTextAnswer("");
    setLongAnswer("");
    setBlankAnswers(Array(blankCount).fill(""));
    if (!isLocked) {
      setFeedback(null);
      setFeedbackTone(null);
    }
    setParentSubmitted(false);
  }

  function updateBlankAnswer(index: number, value: string) {
    setBlankAnswers((current) => {
      const next = [...current];
      while (next.length < blankCount) next.push("");
      next[index] = value;
      return next;
    });
  }

  const mcOptions = shuffledMc?.options ?? [];
  const blanksComplete =
    blankCount > 0 &&
    blankAnswers.length >= blankCount &&
    blankAnswers.slice(0, blankCount).every((value) => value.trim() !== "");

  return (
    <article
      className="space-y-6 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900"
      data-question-slot={difficulty}
    >
      <AssessmentProtected className="space-y-6">
        {question.type === "fill-in-the-blank" ? (
          <p className="text-base leading-loose text-slate-900 dark:text-stone-50">
            {promptParts.map((part, index) => (
              <span key={`${question.id}-part-${index}`}>
                {part ? (
                  <span className="whitespace-pre-wrap">{part}</span>
                ) : null}
                {index < blankCount ? (
                  <input
                    type="text"
                    value={blankAnswers[index] ?? ""}
                    onChange={(e) => updateBlankAnswer(index, e.target.value)}
                    disabled={disabled}
                    aria-label={`Blank ${index + 1}`}
                    className="mx-1 inline-block min-w-[7rem] max-w-[12rem] align-baseline rounded-sm border-0 border-b-2 border-sky-400 bg-sky-50/80 px-2 py-0.5 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60 dark:border-stone-400 dark:bg-stone-900/60 dark:text-stone-100"
                  />
                ) : null}
              </span>
            ))}
          </p>
        ) : (
          <CanvasText
            encoded={toDisplayEncoding(question.prompt)}
            variant="body"
          />
        )}

        {question.type === "multiple-choice" && (
          <fieldset className="space-y-2" disabled={disabled}>
            <legend className="sr-only">Select a response</legend>
            {mcOptions.map((option, index) => (
              <label
                key={`${question.id}-${index}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                <input
                  type="radio"
                  name={`mc-${question.id}`}
                  className="mt-3 size-4 shrink-0 accent-sky-600"
                  checked={selectedIndex === index}
                  onChange={() => setSelectedIndex(index)}
                  aria-label={`Response ${index + 1}`}
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

      {limited && !isLocked && remaining !== null && (
        <p className="text-xs text-slate-500 dark:text-stone-500">
          {remaining === 1
            ? "1 try remaining today"
            : `${remaining} tries remaining today`}
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

      {isLocked && onHeldForToday && (
        <Button type="button" onClick={onHeldForToday}>
          Continue to next question
        </Button>
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
              notifyChecked(correct);
              onSubmit(correct);
            }}
          >
            Submit for Parent Review
          </Button>
        ) : question.type === "fill-in-the-blank" ? (
          <Button
            type="button"
            disabled={disabled || !blanksComplete}
            onClick={() => {
              const result = checkFillInBlank(
                question,
                blankAnswers.slice(0, blankCount),
              );
              if (result.correct) {
                handleCorrectAnswer();
                return;
              }
              if (result.spellingHint) {
                handleWrongAnswer(FILL_IN_BLANK_SPELLING_HINT);
                return;
              }
              handleWrongAnswer(getQuestionHint(question));
            }}
          >
            Check answer
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
              const correct =
                question.type === "multiple-choice"
                  ? validateAnswer(questionForValidation, { selectedIndex })
                  : validateAnswer(questionForValidation, { text: textAnswer });

              if (correct) {
                handleCorrectAnswer();
                return;
              }
              handleWrongAnswer(getQuestionHint(question));
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
