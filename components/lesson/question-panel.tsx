"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  CORRECT_ANSWER_MESSAGE,
  getQuestionHint,
  INCORRECT_ANSWER_MESSAGE,
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
  /** Called with full text when a long-answer passes validation. */
  onLongAnswerSubmit?: (answer: string) => void;
  /** Called when this question is held until tomorrow after exhausting tries. */
  onHeldForToday?: () => void;
  onAnswerChecked?: (result: {
    questionId: string;
    questionType: string;
    prompt: string;
    isCorrect: boolean;
  }) => void;
};

const ANSWER_FEEDBACK_DELAY_MS = 900;

export function QuestionPanel({
  studentScope,
  courseId,
  lessonId,
  question,
  difficulty,
  disabled: disabledExternal = false,
  skipAttemptLimits = false,
  onSubmit,
  onLongAnswerSubmit,
  onHeldForToday,
  onAnswerChecked,
}: QuestionPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [longAnswer, setLongAnswer] = useState("");
  const [blankAnswers, setBlankAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackDetail, setFeedbackDetail] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "retry" | null>(
    null,
  );
  const [transitionPending, setTransitionPending] = useState(false);
  const [parentSubmitted, setParentSubmitted] = useState(false);
  const [attemptVersion, setAttemptVersion] = useState(0);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const disabled =
    disabledExternal || isLocked || transitionPending;
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
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setSelectedIndex(null);
    setTextAnswer("");
    setLongAnswer("");
    setBlankAnswers(Array(blankCount).fill(""));
    setFeedback(null);
    setFeedbackDetail(null);
    setFeedbackTone(null);
    setTransitionPending(false);
    setParentSubmitted(false);
    setAttemptVersion((v) => v + 1);
  }, [question.id, blankCount]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  function notifyChecked(isCorrect: boolean) {
    onAnswerChecked?.({
      questionId: question.id,
      questionType: question.type,
      prompt: question.prompt,
      isCorrect,
    });
  }

  function scheduleAfterFeedback(callback: () => void) {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    setTransitionPending(true);
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      setTransitionPending(false);
      callback();
    }, ANSWER_FEEDBACK_DELAY_MS);
  }

  function showIncorrectFeedback(detail: string) {
    setFeedback(INCORRECT_ANSWER_MESSAGE);
    setFeedbackDetail(detail);
    setFeedbackTone("retry");
    notifyChecked(false);
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
        showIncorrectFeedback(LOCKED_UNTIL_TOMORROW_MESSAGE);
        return;
      }
    }

    showIncorrectFeedback(message);
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
    setFeedback(CORRECT_ANSWER_MESSAGE);
    setFeedbackDetail(null);
    setFeedbackTone("success");
    notifyChecked(true);
    scheduleAfterFeedback(() => onSubmit(true));
  }

  function resetInputs() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setTransitionPending(false);
    setSelectedIndex(null);
    setTextAnswer("");
    setLongAnswer("");
    setBlankAnswers(Array(blankCount).fill(""));
    if (!isLocked) {
      setFeedback(null);
      setFeedbackDetail(null);
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
  const exhaustedAwaitingAck = isLocked && Boolean(onHeldForToday);
  const alertHeadline =
    feedback ?? (exhaustedAwaitingAck ? INCORRECT_ANSWER_MESSAGE : null);
  const alertDetail =
    feedbackDetail ??
    (exhaustedAwaitingAck ? LOCKED_UNTIL_TOMORROW_MESSAGE : null);
  const alertTone =
    feedbackTone ?? (exhaustedAwaitingAck ? ("retry" as const) : null);

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

      {alertHeadline && (
        <div
          role="alert"
          className={cn(
            "rounded-md border px-4 py-3",
            alertTone === "retry"
              ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
              : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30",
          )}
        >
          <p
            className={cn(
              "text-base font-semibold",
              alertTone === "retry"
                ? "text-amber-800 dark:text-amber-200"
                : "text-emerald-800 dark:text-emerald-200",
            )}
          >
            {alertHeadline}
          </p>
          {alertDetail && (
            <p
              className={cn(
                "mt-1 text-sm",
                alertTone === "retry"
                  ? "text-amber-900 dark:text-amber-100"
                  : "text-emerald-900 dark:text-emerald-100",
              )}
            >
              {alertDetail}
            </p>
          )}
        </div>
      )}

      {exhaustedAwaitingAck && (
        <Button type="button" onClick={onHeldForToday}>
          OK
        </Button>
      )}

      {!exhaustedAwaitingAck && (
      <div className="flex flex-wrap gap-3">
        {question.type === "long-answer" ? (
          <Button
            type="button"
            disabled={disabled || parentSubmitted}
            onClick={() => {
              const correct = validateAnswer(questionForValidation, {
                text: longAnswer,
              });
              if (correct) {
                setParentSubmitted(true);
                onLongAnswerSubmit?.(longAnswer.trim());
              }
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
      )}
    </article>
  );
}
