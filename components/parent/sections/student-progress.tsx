"use client";

import { Fragment, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  MOCK_PENDING_SUBMISSIONS,
  MOCK_RUBRIC,
  MOCK_STUDENT,
  type PendingSubmission,
} from "@/lib/parent/mock-data";

export function StudentProgressSection() {
  const [activeRubricId, setActiveRubricId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <SectionIntro
        title="Student progress"
        description="Grades, pending reviews, and course completion at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Current grade" value={MOCK_STUDENT.grade}>
          <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
            {MOCK_STUDENT.gradePercent}% overall
          </p>
        </StatCard>
        <StatCard label="Course" value={MOCK_STUDENT.courseName} />
        <StatCard label="Progress" value={`${MOCK_STUDENT.courseProgress}%`}>
          <ProgressBar percent={MOCK_STUDENT.courseProgress} />
        </StatCard>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-900 dark:text-stone-50">
          Long-answer submissions awaiting grading
        </h3>
        <div className="overflow-hidden rounded-lg border border-sky-200 dark:border-stone-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sky-200 bg-sky-50/80 dark:border-stone-700 dark:bg-stone-800/80">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700 dark:text-stone-300">
                  Submission
                </th>
                <th className="hidden px-4 py-3 font-medium text-slate-700 sm:table-cell dark:text-stone-300">
                  Submitted
                </th>
                <th className="px-4 py-3 font-medium text-slate-700 dark:text-stone-300">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 bg-white dark:divide-stone-800 dark:bg-stone-900">
              {MOCK_PENDING_SUBMISSIONS.map((submission) => (
                <SubmissionRow
                  key={submission.id}
                  submission={submission}
                  rubricOpen={activeRubricId === submission.id}
                  onToggleRubric={() =>
                    setActiveRubricId((id) =>
                      id === submission.id ? null : submission.id,
                    )
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SectionIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
        {title}
      </h2>
      <p className="text-sm text-slate-600 dark:text-stone-400">{description}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-sky-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      <p className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-stone-50">
        {value}
      </p>
      {children}
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="mt-3">
      <div
        className="h-2 overflow-hidden rounded-full bg-sky-100 dark:bg-stone-800"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-sky-600 transition-all dark:bg-stone-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function SubmissionRow({
  submission,
  rubricOpen,
  onToggleRubric,
}: {
  submission: PendingSubmission;
  rubricOpen: boolean;
  onToggleRubric: () => void;
}) {
  return (
    <Fragment>
    <tr>
      <td className="px-4 py-4 align-top">
        <p className="font-medium text-slate-900 dark:text-stone-50">
          {submission.title}
        </p>
        <p className="mt-1 line-clamp-2 text-slate-600 dark:text-stone-400">
          {submission.preview}
        </p>
        <p className="mt-2 text-xs text-slate-500 sm:hidden dark:text-stone-500">
          {submission.submittedAt}
        </p>
      </td>
      <td className="hidden px-4 py-4 align-top text-slate-600 sm:table-cell dark:text-stone-400">
        {submission.submittedAt}
      </td>
      <td className="px-4 py-4 align-top">
        <Button type="button" size="sm" variant="ghost" onClick={onToggleRubric}>
          {rubricOpen ? "Hide rubric" : "View rubric"}
        </Button>
      </td>
    </tr>
    {rubricOpen && (
      <tr>
        <td colSpan={3} className="bg-sky-50/50 px-4 pb-4 dark:bg-stone-800/50">
          <RubricPanel />
        </td>
      </tr>
    )}
    </Fragment>
  );
}

function RubricPanel() {
  return (
    <div className="rounded-md border border-sky-200 bg-white p-4 dark:border-stone-600 dark:bg-stone-900">
      <p className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
        Mock grading rubric
      </p>
      <ul className="mt-3 space-y-2">
        {MOCK_RUBRIC.map((row) => (
          <li
            key={row.criterion}
            className="flex items-center justify-between text-sm text-slate-700 dark:text-stone-300"
          >
            <span>{row.criterion}</span>
            <span className="tabular-nums text-slate-500 dark:text-stone-500">
              / {row.maxPoints} pts
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500 dark:text-stone-500">
        Total: 10 points · Grading UI is mocked for preview.
      </p>
    </div>
  );
}
