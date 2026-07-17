"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import { GradingRubricSummary } from "@/components/grading/grading-rubric-summary";
import { useContentStore } from "@/components/admin/content-store-provider";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import {
  getGradingConfigFromStore,
  getLessonFromStore,
  setGradingConfigInStore,
} from "@/lib/admin/content-store";
import {
  DEFAULT_GRADING_RUBRIC,
  graduationThresholdForLesson,
  maxLessonScore,
  normalizeGradingRubric,
  type GradingRubricConfig,
} from "@/lib/lesson/lesson-grade-config";
import { buildLessonAssessmentPlan } from "@/lib/lesson/lesson-assessment-plan";
import { getCourseFromStore } from "@/lib/admin/content-store";
import { ADMIN_SAVE_PUBLISHED_MESSAGE } from "@/lib/admin/admin-save-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RubricField = keyof GradingRubricConfig;

const RUBRIC_FIELDS: Array<{ key: RubricField; label: string }> = [
  { key: "reviewCount", label: "Review question count" },
  { key: "reviewPointsEach", label: "Review points each" },
  { key: "mcBankSize", label: "MC bank size" },
  { key: "mcTargetCorrect", label: "MC target correct" },
  { key: "mcPointsEach", label: "MC points each" },
  { key: "fibCount", label: "Fill-in-blank count" },
  { key: "fibPointsEach", label: "Fill-in-blank points each" },
  { key: "extraCount", label: "Extra practice count" },
  { key: "extraPointsEach", label: "Extra practice points each" },
  { key: "freeResponseCount", label: "Free response count" },
  { key: "freeResponsePoints", label: "Free response points" },
  { key: "defaultGraduationProblemCount", label: "Default graduation problems" },
];

export function AdminGradingPanel() {
  const { store, persist, saving, actionFeedback, clearActionFeedback } =
    useContentStore();
  const { courseId, lessonId, setCourseId, setLessonId } = useAdminWorkspace();
  const [draft, setDraft] = useState<GradingRubricConfig>(DEFAULT_GRADING_RUBRIC);
  const [graduationDraft, setGraduationDraft] = useState("");

  const course = getCourseFromStore(store, courseId);
  const lesson = getLessonFromStore(store, courseId, lessonId);
  const storedRubric = store.gradingConfigByCourse?.[courseId];
  const rubric = useMemo(
    () => getGradingConfigFromStore(store, courseId),
    [storedRubric, courseId],
  );

  const planPreview = useMemo(() => {
    if (!course || !lesson) return null;
    return buildLessonAssessmentPlan(store, course, lesson, draft);
  }, [course, lesson, draft, store]);

  useEffect(() => {
    setDraft(rubric);
    setGraduationDraft(
      lesson?.graduationProblemCount != null
        ? String(lesson.graduationProblemCount)
        : "",
    );
  }, [courseId, lessonId, lesson?.graduationProblemCount, rubric]);

  async function saveRubric() {
    const normalized = normalizeGradingRubric(draft);
    const result = await persist(setGradingConfigInStore(store, courseId, normalized), {
      scope: "structure",
      successMessage: ADMIN_SAVE_PUBLISHED_MESSAGE,
    });
    if (result.ok) setDraft(normalized);
  }

  async function saveGraduation() {
    if (!course || !lesson) return;
    const parsed = graduationDraft.trim()
      ? Number.parseInt(graduationDraft, 10)
      : undefined;
    if (graduationDraft.trim() && (!Number.isFinite(parsed) || (parsed ?? 0) <= 0)) {
      return;
    }

    const lessons = course.lessons.map((entry) =>
      entry.id === lesson.id
        ? {
            ...entry,
            graduationProblemCount: parsed,
          }
        : entry,
    );

    const result = await persist({
      ...store,
      courses: store.courses.map((c) =>
        c.id === courseId ? { ...c, lessons } : c,
      ),
    }, {
      scope: "structure",
      successMessage: ADMIN_SAVE_PUBLISHED_MESSAGE,
    });
    if (!result.ok) return;
  }

  const graduationThreshold = graduationThresholdForLesson(
    draft,
    lesson?.graduationProblemCount,
  );

  return (
    <div className="space-y-8">
      <AdminActionFeedback
        feedback={actionFeedback}
        onDismiss={clearActionFeedback}
      />

      <AdminLessonPicker
        store={store}
        courseId={courseId}
        lessonId={lessonId}
        onCourseChange={setCourseId}
        onLessonChange={setLessonId}
      />

      <GradingRubricSummary
        config={draft}
        graduationThreshold={graduationThreshold}
      />

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Adjust rubric (course-wide)
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          These settings apply to every lesson in the selected course. Parents see
          the same breakdown on their progress page.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RUBRIC_FIELDS.map(({ key, label }) => (
            <label key={key} className="block text-sm">
              <span className="text-slate-600 dark:text-stone-400">{label}</span>
              <Input
                type="number"
                min={1}
                value={draft[key]}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    [key]: Number(e.target.value),
                  }))
                }
                className="mt-1"
              />
            </label>
          ))}
        </div>

        <p className="text-sm font-medium text-slate-800 dark:text-stone-200">
          Max lesson score: {maxLessonScore(normalizeGradingRubric(draft))} points
        </p>

        <Button type="button" size="sm" disabled={saving} onClick={() => void saveRubric()}>
          {saving ? "Saving…" : "Save rubric"}
        </Button>
      </section>

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Graduation threshold (this lesson)
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Number of problems a student must solve correctly (MC + fill-in-blank +
          extra practice) to graduate this section. Leave blank to use the course
          default ({draft.defaultGraduationProblemCount}).
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-stone-400">Problems to graduate</span>
            <Input
              type="number"
              min={1}
              value={graduationDraft}
              onChange={(e) => setGraduationDraft(e.target.value)}
              placeholder={String(draft.defaultGraduationProblemCount)}
              className="mt-1 w-40"
            />
          </label>
          <Button type="button" size="sm" disabled={saving} onClick={() => void saveGraduation()}>
            Save graduation
          </Button>
        </div>
      </section>

      {planPreview && lesson && (
        <section className="space-y-2 rounded-lg border border-sky-200 bg-sky-50/40 p-5 dark:border-stone-700 dark:bg-stone-950">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-stone-50">
            Question plan preview — {lesson.title}
          </h2>
          <ul className="text-sm text-slate-700 dark:text-stone-300">
            <li>Review: {planPreview.review.length} / {draft.reviewCount}</li>
            <li>Multiple choice: {planPreview.multipleChoice.length} / {draft.mcBankSize}</li>
            <li>Fill in blank: {planPreview.fillInBlank.length} / {draft.fibCount}</li>
            <li>Extra practice: {planPreview.extraPractice.length} / {draft.extraCount}</li>
            <li>Free response: {planPreview.freeResponse ? 1 : 0} / {draft.freeResponseCount}</li>
          </ul>
        </section>
      )}
    </div>
  );
}
