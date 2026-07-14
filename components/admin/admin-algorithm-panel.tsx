"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import { useContentStore } from "@/components/admin/content-store-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  applyPersistResult,
  ADMIN_SAVE_PUBLISHED_MESSAGE,
} from "@/lib/admin/admin-save-feedback";
import type { AdminFeedback } from "@/components/admin/admin-action-feedback";
import {
  getAlgorithmConfigFromStore,
  getCourseFromStore,
  getGradingConfigFromStore,
  setAlgorithmConfigInStore,
  setGradingConfigInStore,
} from "@/lib/admin/content-store";
import {
  ALGORITHM_FIELD_META,
  DEFAULT_ASSIGNMENT_ALGORITHM,
  normalizeAssignmentAlgorithm,
  type AssignmentAlgorithmConfig,
} from "@/lib/lesson/assignment-algorithm-config";
import { explainCourseAssessmentByChapter } from "@/lib/lesson/assessment-plan-explain";
import {
  DEFAULT_GRADING_RUBRIC,
  normalizeGradingRubric,
  type GradingRubricConfig,
} from "@/lib/lesson/lesson-grade-config";
import { lessonChapterNumber, sortLessons } from "@/lib/student/lesson-sort";
import { cn } from "@/lib/utils";

const COUNT_FIELDS: Array<{
  key: keyof Pick<
    GradingRubricConfig,
    | "reviewCount"
    | "mcBankSize"
    | "mcTargetCorrect"
    | "fibCount"
    | "extraCount"
    | "freeResponseCount"
  >;
  label: string;
  description: string;
}> = [
  {
    key: "reviewCount",
    label: "Review count",
    description: "Warm-up questions from the lesson review bank.",
  },
  {
    key: "mcBankSize",
    label: "MC bank size",
    description: "Multiple-choice items drawn from this lesson’s chapter bank.",
  },
  {
    key: "mcTargetCorrect",
    label: "MC target correct",
    description: "Correct answers needed to finish the MC phase.",
  },
  {
    key: "fibCount",
    label: "Fill-in-blank count",
    description: "FIB items from this lesson’s chapter bank.",
  },
  {
    key: "extraCount",
    label: "Graded extra count",
    description: "Cross-lesson review questions for the graded path.",
  },
  {
    key: "freeResponseCount",
    label: "Free response count",
    description: "Long-answer items from this lesson (usually 0–1).",
  },
];

const ROLE_LABELS: Record<string, string> = {
  "current-lesson": "This lesson’s chapter bank",
  "review-bank": "This lesson’s review bank",
  "prior-section": "Earlier section this chapter",
  "prior-chapter": "Previous chapter",
  "other-lesson": "Elsewhere in the course",
  "prior-review": "Prior lesson review bank",
};

export function AdminAlgorithmPanel() {
  const { store, persist, saving, actionFeedback, clearActionFeedback } =
    useContentStore();
  const { courseId, setCourseId } = useAdminWorkspace();
  const [algorithmDraft, setAlgorithmDraft] = useState<AssignmentAlgorithmConfig>(
    DEFAULT_ASSIGNMENT_ALGORITHM,
  );
  const [countsDraft, setCountsDraft] = useState<GradingRubricConfig>(
    DEFAULT_GRADING_RUBRIC,
  );
  const [saveFeedback, setSaveFeedback] = useState<AdminFeedback | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const course = getCourseFromStore(store, courseId);
  const storedAlgorithm = store.algorithmConfigByCourse?.[courseId];
  const storedRubric = store.gradingConfigByCourse?.[courseId];
  const savedAlgorithm = useMemo(
    () => getAlgorithmConfigFromStore(store, courseId),
    [storedAlgorithm, courseId, store],
  );
  const savedRubric = useMemo(
    () => getGradingConfigFromStore(store, courseId),
    [storedRubric, courseId, store],
  );

  const isDirty =
    JSON.stringify(algorithmDraft) !== JSON.stringify(savedAlgorithm) ||
    COUNT_FIELDS.some(
      ({ key }) => countsDraft[key] !== savedRubric[key],
    );

  useEffect(() => {
    setAlgorithmDraft(savedAlgorithm);
    setCountsDraft(savedRubric);
    setSaveFeedback(null);
    setExpandedLessonId(null);
  }, [courseId, savedAlgorithm, savedRubric]);

  const chapterGroups = useMemo(() => {
    if (!course) return [];
    return explainCourseAssessmentByChapter(
      store,
      course,
      countsDraft,
      algorithmDraft,
    );
  }, [course, store, countsDraft, algorithmDraft]);

  const courseChapters = useMemo(() => {
    if (!course) return [];
    const byChapter = new Map<number, string>();
    for (const lesson of sortLessons(course.lessons)) {
      const chapter = lessonChapterNumber(lesson);
      if (!byChapter.has(chapter)) {
        byChapter.set(chapter, lesson.chapterTitle || `Chapter ${chapter}`);
      }
    }
    return [...byChapter.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([chapter, title]) => ({ chapter, title }));
  }, [course]);

  function togglePriorReviewChapter(chapter: number, enabled: boolean) {
    setSaveFeedback(null);
    setAlgorithmDraft((current) => {
      const set = new Set(current.priorReviewChapterNumbers);
      if (enabled) set.add(chapter);
      else set.delete(chapter);
      return {
        ...current,
        priorReviewChapterNumbers: [...set].sort((a, b) => a - b),
      };
    });
  }

  async function saveChanges() {
    setSaveFeedback(null);
    const nextAlgorithm = normalizeAssignmentAlgorithm(algorithmDraft);
    const nextRubric = normalizeGradingRubric({
      ...savedRubric,
      ...Object.fromEntries(
        COUNT_FIELDS.map(({ key }) => [key, countsDraft[key]]),
      ),
    });

    let nextStore = setAlgorithmConfigInStore(store, courseId, nextAlgorithm);
    nextStore = setGradingConfigInStore(nextStore, courseId, nextRubric);

    const result = await persist(nextStore, { silent: true });
    setSaveFeedback(applyPersistResult(result, ADMIN_SAVE_PUBLISHED_MESSAGE));
    if (result.ok) {
      setAlgorithmDraft(nextAlgorithm);
      setCountsDraft(nextRubric);
    }
  }

  function discardChanges() {
    setAlgorithmDraft(savedAlgorithm);
    setCountsDraft(savedRubric);
    setSaveFeedback(null);
  }

  return (
    <div className="space-y-8">
      <AdminActionFeedback
        feedback={actionFeedback}
        onDismiss={clearActionFeedback}
      />

      <AdminSaveBar
        isDirty={isDirty}
        saving={saving}
        feedback={saveFeedback}
        dirtyMessage="You have unsaved algorithm changes."
        onSave={saveChanges}
        onDiscard={discardChanges}
        onDismissFeedback={() => setSaveFeedback(null)}
      />

      <header className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Question assignment algorithm
        </h2>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-stone-400">
          Shows how each lesson builds its graded plan from the review bank and
          chapter question banks, then lets you tune the selection rules.
          Points and letter grades stay on{" "}
          <Link
            href="/admin/grading"
            className="font-medium text-sky-700 underline dark:text-sky-300"
          >
            Grading
          </Link>
          .
        </p>
      </header>

      <label className="block max-w-sm text-sm">
        <span className="text-slate-600 dark:text-stone-400">Course</span>
        <select
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          className="mt-1 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
        >
          {store.courses.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
      </label>

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h3 className="text-base font-semibold text-slate-900 dark:text-stone-50">
          How the graded path works
        </h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-stone-300">
          <li>
            <strong>Review</strong> — first N questions from the lesson’s Review
            bank (admin → Review questions).
          </li>
          <li>
            <strong>Multiple choice / fill-in-blank / free response</strong> —
            by default, first N items of each type from this lesson’s Chapter
            questions bank. Chapters marked below can reuse prior lessons’
            review banks for MC and fill-in-blank instead.
          </li>
          <li>
            <strong>Graded extra</strong> — prefer prior sections in the same
            chapter (or the previous chapter on section 1), then fill from the
            rest of the course.
          </li>
          <li>
            <strong>Optional bonus /practice</strong> — sticky easy questions +
            leftover Alcumus pool (separate from the graded path).
          </li>
        </ol>
      </section>

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h3 className="text-base font-semibold text-slate-900 dark:text-stone-50">
          Selection knobs
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {ALGORITHM_FIELD_META.map((field) => (
            <label key={field.key} className="block space-y-1 text-sm">
              <span className="font-medium text-slate-800 dark:text-stone-200">
                {field.label}
              </span>
              <p className="text-xs text-slate-500 dark:text-stone-500">
                {field.description}
              </p>
              <Input
                type="number"
                min={field.min}
                max={field.max}
                value={algorithmDraft[field.key]}
                onChange={(event) => {
                  setSaveFeedback(null);
                  const value = Number.parseInt(event.target.value, 10);
                  setAlgorithmDraft((current) => ({
                    ...current,
                    [field.key]: Number.isFinite(value)
                      ? value
                      : current[field.key],
                  }));
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-stone-50">
            Chapters that reuse prior review questions
          </h3>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            For chapters that don’t lend themselves to new MC or fill-in-blank
            items (for example philosophy of science), enable this so MC and
            fill-in-blank draw from earlier lessons’ review banks. Stored in the
            course algorithm config — not hardcoded. Warm-up review and free
            response still use this lesson’s own content when present.
          </p>
        </div>

        {courseChapters.length === 0 ? (
          <p className="text-sm text-slate-500">No chapters in this course yet.</p>
        ) : (
          <ul className="space-y-2">
            {courseChapters.map(({ chapter, title }) => {
              const enabled =
                algorithmDraft.priorReviewChapterNumbers.includes(chapter);
              return (
                <li key={chapter}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-sky-100 px-3 py-2.5 text-sm hover:bg-sky-50 dark:border-stone-800 dark:hover:bg-stone-800/60">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={enabled}
                      onChange={(event) =>
                        togglePriorReviewChapter(chapter, event.target.checked)
                      }
                    />
                    <span>
                      <span className="font-medium text-slate-900 dark:text-stone-50">
                        Chapter {chapter}
                        {title ? ` · ${title}` : ""}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-stone-500">
                        {enabled
                          ? "MC & fill-in-blank come from prior lessons’ review banks."
                          : "Uses this chapter’s own question bank for MC & fill-in-blank."}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-stone-50">
            Plan counts (also used by Grading)
          </h3>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            These control how many questions each phase requests. Saving here
            updates the same course rubric as the Grading tab (points unchanged).
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COUNT_FIELDS.map((field) => (
            <label key={field.key} className="block space-y-1 text-sm">
              <span className="font-medium text-slate-800 dark:text-stone-200">
                {field.label}
              </span>
              <p className="text-xs text-slate-500 dark:text-stone-500">
                {field.description}
              </p>
              <Input
                type="number"
                min={0}
                value={countsDraft[field.key]}
                onChange={(event) => {
                  setSaveFeedback(null);
                  const value = Number.parseInt(event.target.value, 10);
                  setCountsDraft((current) => ({
                    ...current,
                    [field.key]: Number.isFinite(value)
                      ? value
                      : current[field.key],
                  }));
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-stone-50">
          Current state by chapter
        </h3>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Live simulation against the question banks with your draft settings
          (not yet saved until you click Save). Expand a lesson to see every
          phase and where each question came from.
        </p>

        {!course ? (
          <p className="text-sm text-slate-500">No course selected.</p>
        ) : chapterGroups.length === 0 ? (
          <p className="text-sm text-slate-500">This course has no lessons yet.</p>
        ) : (
          <div className="space-y-6">
            {chapterGroups.map((group) => (
              <div
                key={group.chapter}
                className="space-y-3 rounded-lg border border-sky-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900"
              >
                <h4 className="text-sm font-semibold uppercase tracking-wide text-sky-800 dark:text-stone-300">
                  Chapter {group.chapter}
                  {group.chapterTitle ? ` · ${group.chapterTitle}` : ""}
                  {algorithmDraft.priorReviewChapterNumbers.includes(
                    group.chapter,
                  ) ? (
                    <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      Prior reviews for MC/FIB
                    </span>
                  ) : null}
                </h4>
                <ul className="space-y-2">
                  {group.lessons.map((lesson) => {
                    const open = expandedLessonId === lesson.lessonId;
                    return (
                      <li
                        key={lesson.lessonId}
                        className="rounded-md border border-sky-100 dark:border-stone-800"
                      >
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-sky-50 dark:hover:bg-stone-800/70"
                          onClick={() =>
                            setExpandedLessonId(open ? null : lesson.lessonId)
                          }
                          aria-expanded={open}
                        >
                          <span className="font-medium text-slate-900 dark:text-stone-50">
                            {lesson.chapter}.{lesson.section} {lesson.lessonTitle}
                          </span>
                          <span className="shrink-0 text-xs text-slate-500 dark:text-stone-500">
                            Review {lesson.phases[0]?.selected ?? 0}/
                            {lesson.phases[0]?.requested ?? 0} · MC{" "}
                            {lesson.phases[1]?.selected ?? 0}/
                            {lesson.phases[1]?.requested ?? 0} · Extra{" "}
                            {lesson.phases[3]?.selected ?? 0}/
                            {lesson.phases[3]?.requested ?? 0}
                          </span>
                        </button>

                        {open && (
                          <div className="space-y-4 border-t border-sky-100 px-3 py-3 dark:border-stone-800">
                            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-stone-400">
                              {lesson.narrative.map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>

                            <p className="text-xs text-slate-500 dark:text-stone-500">
                              Bonus /practice split: {lesson.bonusSplit.assignmentSlots}{" "}
                              easy assignment slot
                              {lesson.bonusSplit.assignmentSlots === 1 ? "" : "s"} of{" "}
                              {lesson.bonusSplit.easyAvailable} easy ·{" "}
                              {lesson.bonusSplit.practicePool} in leftover pool
                            </p>

                            <div className="space-y-3">
                              {lesson.phases.map((phase) => (
                                <div
                                  key={phase.id}
                                  className="rounded-md bg-sky-50/60 px-3 py-2 dark:bg-stone-950/50"
                                >
                                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <p className="text-sm font-medium text-slate-900 dark:text-stone-50">
                                      {phase.label}
                                    </p>
                                    <p
                                      className={cn(
                                        "text-xs font-medium tabular-nums",
                                        phase.selected < phase.requested
                                          ? "text-amber-700 dark:text-amber-300"
                                          : "text-slate-500 dark:text-stone-500",
                                      )}
                                    >
                                      {phase.selected}/{phase.requested} selected
                                      {phase.available > 0
                                        ? ` · ${phase.available} available`
                                        : ""}
                                    </p>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-600 dark:text-stone-400">
                                    {phase.rule}
                                  </p>
                                  {phase.sources.length > 0 && (
                                    <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-stone-400">
                                      {phase.sources.map((source) => (
                                        <li
                                          key={`${phase.id}-${source.lessonId}-${source.role}`}
                                        >
                                          {source.count}× from {source.chapter}.
                                          {source.section} {source.lessonTitle} (
                                          {ROLE_LABELS[source.role] ?? source.role})
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  {phase.samplePrompts.length > 0 && (
                                    <ul className="mt-2 space-y-0.5 text-xs italic text-slate-500 dark:text-stone-500">
                                      {phase.samplePrompts.map((prompt) => (
                                        <li key={prompt}>“{prompt}”</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>

                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/admin/assignment`}>
                                Edit chapter questions
                              </Link>
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
