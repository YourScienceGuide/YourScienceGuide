"use client";

import { AdminCsvImportBlock } from "@/components/admin/admin-csv-import-block";
import { AdminFlashcardCsvImportBlock } from "@/components/admin/admin-flashcard-csv-import-block";
import { AdminReviewCsvImportBlock } from "@/components/admin/admin-review-csv-import-block";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";

export function AdminCsvImportPanel() {
  const { courseId, lessonId, setCourseId, setLessonId } = useAdminWorkspace();

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Chapter question bank
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Import questions for a lesson in one file. Set <strong>Level</strong> to 1–2 for
          easier problems (eligible for the required assignment) or 3–5 for harder extra
          practice-only problems. Up to four level 1–2 questions are chosen at random per
          student for the assignment; the rest flow to extra practice.
        </p>
        <AdminCsvImportBlock
          kind="chapter"
          courseId={courseId}
          lessonId={lessonId}
          onCourseChange={setCourseId}
          onLessonChange={setLessonId}
        />
      </section>

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Review questions
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Warm-up questions shown before readings and the lesson video. Students must
          complete them to unlock the rest of the lesson.
        </p>
        <AdminReviewCsvImportBlock
          courseId={courseId}
          lessonId={lessonId}
          onCourseChange={setCourseId}
          onLessonChange={setLessonId}
        />
      </section>

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Flashcards
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Import flashcard <strong>terms</strong> only. Students write their own
          definitions during review.
        </p>
        <AdminFlashcardCsvImportBlock
          courseId={courseId}
          lessonId={lessonId}
          onCourseChange={setCourseId}
          onLessonChange={setLessonId}
        />
      </section>
    </div>
  );
}
