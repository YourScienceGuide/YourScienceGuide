"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import { QuestionPanel } from "@/components/lesson/question-panel";
import type { LessonQuestion } from "@/lib/lesson/types";

export type LessonFreeResponseContextValue = {
  studentScope: string;
  courseId: string;
  lessonId: string;
  familyStudentId: string | null;
  question: LessonQuestion;
  submitted: boolean;
  onSubmitAnswer: (answerText: string) => Promise<void>;
};

const LessonFreeResponseContext =
  createContext<LessonFreeResponseContextValue | null>(null);

export function LessonFreeResponseProvider({
  value,
  children,
}: {
  value: LessonFreeResponseContextValue | null;
  children: ReactNode;
}) {
  return (
    <LessonFreeResponseContext.Provider value={value}>
      {children}
    </LessonFreeResponseContext.Provider>
  );
}

export function useLessonFreeResponse() {
  return useContext(LessonFreeResponseContext);
}

/** Student free-response UI — place below bonus practice and above flashcards. */
export function LessonFreeResponseSection() {
  const ctx = useLessonFreeResponse();
  if (!ctx) return null;

  const {
    studentScope,
    courseId,
    lessonId,
    familyStudentId,
    question,
    submitted,
    onSubmitAnswer,
  } = ctx;

  if (submitted) {
    return (
      <section
        className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-4 dark:border-emerald-900/50 dark:bg-emerald-950/20"
        aria-label="Free response completed"
      >
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Free response{" "}
          <span className="text-emerald-700 dark:text-emerald-300">— Completed</span>
        </h2>
        <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-100">
          Your response has been submitted for your parent to review.
        </p>
      </section>
    );
  }

  return (
    <section
      className="space-y-4 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900"
      aria-labelledby="free-response-heading"
    >
      <div className="space-y-1">
        <h2
          id="free-response-heading"
          className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
        >
          Free response
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Write a longer answer for your parent to review.
        </p>
        <p className="text-xs tabular-nums text-slate-500 dark:text-stone-500">
          Not submitted
        </p>
      </div>

      {!familyStudentId ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Sign in and select a student profile to submit your free response for parent
          review.
        </p>
      ) : (
        <QuestionPanel
          key={`fr-${question.id}`}
          studentScope={studentScope}
          courseId={courseId}
          lessonId={lessonId}
          question={question}
          difficulty={1}
          disabled={submitted}
          onLongAnswerSubmit={async (answerText) => {
            await onSubmitAnswer(answerText);
          }}
          onSubmit={() => undefined}
        />
      )}
    </section>
  );
}
