"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

import { useActiveStudent } from "@/components/family/active-student-provider";
import { GradingRubricSummary } from "@/components/grading/grading-rubric-summary";
import { formatGradeLabel } from "@/components/grading/grading-rubric-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchParentStudentProgress,
  gradeSubmission,
  type ParentStudentProgressResponse,
} from "@/lib/parent/student-progress-client";
import type { LongAnswerSubmission } from "@/lib/student/lesson-grades.server";
import { cn } from "@/lib/utils";

export function StudentProgressSection() {
  const { students, activeStudent } = useActiveStudent();
  const [viewingId, setViewingId] = useState(
    () => activeStudent?.id ?? students[0]?.id ?? "",
  );
  const [data, setData] = useState<ParentStudentProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);

  const student =
    students.find((s) => s.id === viewingId) ?? students[0] ?? null;

  const load = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchParentStudentProgress(student.id);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load progress");
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!student) return null;

  return (
    <div className="space-y-8">
      <SectionIntro
        title="Student progress"
        description="Grades, rubric breakdown, and pending free-response reviews."
      />

      {students.length > 1 && (
        <div className="space-y-2">
          <label
            htmlFor="progress-student-select"
            className="text-sm font-medium text-slate-700 dark:text-stone-300"
          >
            Viewing progress for
          </label>
          <select
            id="progress-student-select"
            value={viewingId}
            onChange={(e) => setViewingId(e.target.value)}
            className={cn(
              "w-full max-w-md rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
              "dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50",
            )}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-600 dark:text-stone-400">Loading progress…</p>
      )}
      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Current grade" value={data.gradeLabel}>
              <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
                {data.overallPercent}% across graded lessons
              </p>
            </StatCard>
            <StatCard label="Course" value={data.courseName} />
            <StatCard label="Progress" value={`${data.courseProgress}%`}>
              <ProgressBar percent={data.courseProgress} />
            </StatCard>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-slate-900 dark:text-stone-50">
              How grading works
            </h3>
            <GradingRubricSummary
              config={data.rubric.config}
              graduationThreshold={data.rubric.config.defaultGraduationProblemCount}
            />
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-slate-900 dark:text-stone-50">
              Lesson scores
              <span className="ml-2 font-normal text-slate-500 dark:text-stone-500">
                ({student.displayName})
              </span>
            </h3>
            {data.lessonGrades.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-stone-400">
                No graded lessons yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-sky-200 dark:border-stone-700">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-sky-200 bg-sky-50/80 dark:border-stone-700 dark:bg-stone-800/80">
                    <tr>
                      <th className="px-4 py-3 font-medium">Lesson</th>
                      <th className="px-4 py-3 font-medium">Score</th>
                      <th className="px-4 py-3 font-medium">Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100 bg-white dark:divide-stone-800 dark:bg-stone-900">
                    {data.lessonGrades.map((grade) => (
                      <tr key={grade.id}>
                        <td className="px-4 py-3 align-top font-medium">
                          {grade.lessonId}
                        </td>
                        <td className="px-4 py-3 align-top tabular-nums">
                          {grade.earnedPoints}/{grade.possiblePoints} ·{" "}
                          {formatGradeLabel(grade.percent)}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-600 dark:text-stone-400">
                          Review {grade.scoreBreakdown.review} · MC{" "}
                          {grade.scoreBreakdown.multipleChoice} · FIB{" "}
                          {grade.scoreBreakdown.fillInBlank} · Extra{" "}
                          {grade.scoreBreakdown.extraPractice} · FR{" "}
                          {grade.scoreBreakdown.freeResponse}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900 dark:text-stone-50">
              Free-response submissions awaiting grading
            </h3>
            {data.pendingSubmissions.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-stone-400">
                No pending submissions.
              </p>
            ) : (
              <div className="space-y-4">
                {data.pendingSubmissions.map((submission) => (
                  <SubmissionGradeCard
                    key={submission.id}
                    submission={submission}
                    open={gradingId === submission.id}
                    onToggle={() =>
                      setGradingId((id) =>
                        id === submission.id ? null : submission.id,
                      )
                    }
                    onGraded={() => void load()}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SubmissionGradeCard({
  submission,
  open,
  onToggle,
  onGraded,
}: {
  submission: LongAnswerSubmission;
  open: boolean;
  onToggle: () => void;
  onGraded: () => void;
}) {
  const [score, setScore] = useState("10");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      await gradeSubmission({
        submissionId: submission.id,
        parentScore: Number(score),
        parentFeedback: feedback.trim() || undefined,
      });
      onGraded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save grade");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-sky-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900 dark:text-stone-50">
            {submission.promptExcerpt}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Lesson {submission.lessonId} · {submission.createdAt}
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onToggle}>
          {open ? "Hide" : "Grade"}
        </Button>
      </div>
      {open && (
        <div className="mt-4 space-y-3 border-t border-sky-100 pt-4 dark:border-stone-800">
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-stone-300">
            {submission.answerText}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              Score (0–{submission.maxPoints})
              <Input
                type="number"
                min={0}
                max={submission.maxPoints}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="mt-1 w-24"
              />
            </label>
            <label className="min-w-[12rem] flex-1 text-sm">
              Feedback (optional)
              <Input
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-1"
              />
            </label>
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSubmit()}>
              {saving ? "Saving…" : "Save grade"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
      )}
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
  children?: React.ReactNode;
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
