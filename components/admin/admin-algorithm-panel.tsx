"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  getChapterOverride,
  normalizeAssignmentAlgorithm,
  setChapterOverride,
  type AssignmentAlgorithmConfig,
  type ChapterAlgorithmOverride,
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
    description: "Default warm-up questions from each lesson review bank.",
  },
  {
    key: "mcBankSize",
    label: "MC bank size",
    description: "Default MC items from the chapter bank (or prior reviews).",
  },
  {
    key: "mcTargetCorrect",
    label: "MC target correct",
    description: "Correct answers needed to finish the MC phase.",
  },
  {
    key: "fibCount",
    label: "Fill-in-blank count",
    description: "Default FIB items per lesson.",
  },
  {
    key: "extraCount",
    label: "Graded extra count",
    description: "Default cross-lesson review questions.",
  },
  {
    key: "freeResponseCount",
    label: "Free response count",
    description: "Default long-answer items (usually 0–1).",
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

type ChapterCountKey = keyof Pick<
  ChapterAlgorithmOverride,
  | "reviewCount"
  | "mcBankSize"
  | "mcTargetCorrect"
  | "fibCount"
  | "extraCount"
  | "freeResponseCount"
>;

const CHAPTER_COUNT_FIELDS: Array<{ key: ChapterCountKey; label: string }> = [
  { key: "reviewCount", label: "Review" },
  { key: "mcBankSize", label: "MC bank" },
  { key: "mcTargetCorrect", label: "MC target" },
  { key: "fibCount", label: "FIB" },
  { key: "extraCount", label: "Extra" },
  { key: "freeResponseCount", label: "Free response" },
];

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
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);

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
    COUNT_FIELDS.some(({ key }) => countsDraft[key] !== savedRubric[key]);

  useEffect(() => {
    setAlgorithmDraft(savedAlgorithm);
    setCountsDraft(savedRubric);
    setSaveFeedback(null);
    setExpandedLessonId(null);
    setExpandedChapter(null);
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

  function patchChapter(chapter: number, patch: ChapterAlgorithmOverride) {
    setSaveFeedback(null);
    setAlgorithmDraft((current) => {
      const existing = { ...getChapterOverride(current, chapter) };
      const next: ChapterAlgorithmOverride = { ...existing };

      for (const key of Object.keys(patch) as Array<keyof ChapterAlgorithmOverride>) {
        const value = patch[key];
        if (value === undefined) {
          delete next[key];
        } else {
          (next as Record<string, unknown>)[key] = value;
        }
      }

      return setChapterOverride(current, chapter, next);
    });
  }

  function clearChapterCount(chapter: number, key: ChapterCountKey) {
    setSaveFeedback(null);
    setAlgorithmDraft((current) => {
      const existing = { ...getChapterOverride(current, chapter) };
      delete existing[key];
      return setChapterOverride(current, chapter, existing);
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

    const result = await persist(nextStore, { silent: true, scope: "structure" });
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
          Set course-wide defaults, then override individual chapters — for
          example more warm-up review, or review-only chapters with no new
          MC/FIB. Points stay on{" "}
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
          Course defaults
        </h3>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Used when a chapter does not set its own override.
        </p>
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
        <div className="grid gap-4 border-t border-sky-100 pt-4 sm:grid-cols-2 dark:border-stone-800">
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

      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-stone-50">
            Edit by chapter
          </h3>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            Expand a chapter to change its review count, mark it review-only
            (no new questions), or reuse prior review banks for MC/FIB. Leave
            count fields blank to use the course default.
          </p>
        </div>

        {courseChapters.length === 0 ? (
          <p className="text-sm text-slate-500">No chapters in this course yet.</p>
        ) : (
          <div className="space-y-4">
            {courseChapters.map(({ chapter, title }) => {
              const override = getChapterOverride(algorithmDraft, chapter);
              const open = expandedChapter === chapter;
              const group = chapterGroups.find((entry) => entry.chapter === chapter);
              return (
                <div
                  key={chapter}
                  className="rounded-lg border border-sky-200 bg-white dark:border-stone-700 dark:bg-stone-900"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    aria-expanded={open}
                    onClick={() =>
                      setExpandedChapter(open ? null : chapter)
                    }
                  >
                    <span className="space-y-1">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-stone-50">
                        Chapter {chapter}
                        {title ? ` · ${title}` : ""}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        {override.reviewOnly ? (
                          <Badge>Review only</Badge>
                        ) : null}
                        {override.usePriorReviewsForMcFib ? (
                          <Badge>Prior reviews for MC/FIB</Badge>
                        ) : null}
                        {override.reviewCount !== undefined ? (
                          <Badge>Review ×{override.reviewCount}</Badge>
                        ) : null}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {open ? "Hide" : "Edit"}
                    </span>
                  </button>

                  {open && (
                    <div className="space-y-4 border-t border-sky-100 px-4 py-4 dark:border-stone-800">
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={Boolean(override.reviewOnly)}
                          onChange={(event) =>
                            patchChapter(chapter, {
                              reviewOnly: event.target.checked || undefined,
                              ...(event.target.checked
                                ? { usePriorReviewsForMcFib: undefined }
                                : {}),
                            })
                          }
                        />
                        <span>
                          <span className="font-medium text-slate-900 dark:text-stone-50">
                            Review only — no new questions
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500 dark:text-stone-500">
                            Students only do this chapter’s warm-up review.
                            MC, fill-in-blank, graded extra, and free response
                            are skipped.
                          </span>
                        </span>
                      </label>

                      <label
                        className={cn(
                          "flex items-start gap-3 text-sm",
                          override.reviewOnly && "opacity-50",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          disabled={Boolean(override.reviewOnly)}
                          checked={Boolean(override.usePriorReviewsForMcFib)}
                          onChange={(event) =>
                            patchChapter(chapter, {
                              usePriorReviewsForMcFib: event.target.checked
                                ? true
                                : undefined,
                            })
                          }
                        />
                        <span>
                          <span className="font-medium text-slate-900 dark:text-stone-50">
                            Reuse prior lessons’ review banks for MC & FIB
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500 dark:text-stone-500">
                            Useful when the chapter doesn’t lend itself to new
                            multiple-choice or fill-in-blank items.
                          </span>
                        </span>
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {CHAPTER_COUNT_FIELDS.map(({ key, label }) => {
                          const inherited = countsDraft[key];
                          const value = override[key];
                          const disabled =
                            Boolean(override.reviewOnly) &&
                            key !== "reviewCount";
                          return (
                            <label
                              key={key}
                              className={cn(
                                "block space-y-1 text-sm",
                                disabled && "opacity-50",
                              )}
                            >
                              <span className="font-medium text-slate-800 dark:text-stone-200">
                                {label}
                              </span>
                              <span className="block text-xs text-slate-500">
                                Default {inherited}
                                {value === undefined ? " (using default)" : ""}
                              </span>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  disabled={disabled}
                                  placeholder={String(inherited)}
                                  value={value ?? ""}
                                  onChange={(event) => {
                                    const raw = event.target.value.trim();
                                    if (raw === "") {
                                      clearChapterCount(chapter, key);
                                      return;
                                    }
                                    const parsed = Number.parseInt(raw, 10);
                                    if (!Number.isFinite(parsed) || parsed < 0) {
                                      return;
                                    }
                                    patchChapter(chapter, { [key]: parsed });
                                  }}
                                />
                                {value !== undefined && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={disabled}
                                    onClick={() =>
                                      clearChapterCount(chapter, key)
                                    }
                                  >
                                    Default
                                  </Button>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {group && (
                        <ul className="space-y-2 border-t border-sky-100 pt-4 dark:border-stone-800">
                          <li className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Lesson preview
                          </li>
                          {group.lessons.map((lesson) => {
                            const lessonOpen =
                              expandedLessonId === lesson.lessonId;
                            return (
                              <li
                                key={lesson.lessonId}
                                className="rounded-md border border-sky-100 dark:border-stone-800"
                              >
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-sky-50 dark:hover:bg-stone-800/70"
                                  onClick={() =>
                                    setExpandedLessonId(
                                      lessonOpen ? null : lesson.lessonId,
                                    )
                                  }
                                >
                                  <span className="font-medium text-slate-900 dark:text-stone-50">
                                    {lesson.chapter}.{lesson.section}{" "}
                                    {lesson.lessonTitle}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    Review {lesson.phases[0]?.selected ?? 0}/
                                    {lesson.phases[0]?.requested ?? 0} · MC{" "}
                                    {lesson.phases[1]?.selected ?? 0}/
                                    {lesson.phases[1]?.requested ?? 0}
                                  </span>
                                </button>
                                {lessonOpen && (
                                  <div className="space-y-2 border-t border-sky-100 px-3 py-3 text-xs text-slate-600 dark:border-stone-800 dark:text-stone-400">
                                    <ul className="list-disc space-y-1 pl-4">
                                      {lesson.narrative.map((line) => (
                                        <li key={line}>{line}</li>
                                      ))}
                                    </ul>
                                    {lesson.phases.map((phase) => (
                                      <div key={phase.id} className="space-y-1">
                                        <p className="font-medium text-slate-800 dark:text-stone-200">
                                          {phase.label}{" "}
                                          <span className="font-normal text-slate-500">
                                            {phase.selected}/{phase.requested}
                                          </span>
                                        </p>
                                        <p>{phase.rule}</p>
                                        {phase.sources.map((source) => (
                                          <p
                                            key={`${phase.id}-${source.lessonId}-${source.role}`}
                                          >
                                            {source.count}× from {source.chapter}.
                                            {source.section} {source.lessonTitle}{" "}
                                            (
                                            {ROLE_LABELS[source.role] ??
                                              source.role}
                                            )
                                          </p>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      {children}
    </span>
  );
}
