"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useContentStore } from "@/components/admin/content-store-provider";
import { CurriculumLessonRow } from "@/components/student/curriculum-lesson-row";
import { TextbookCard } from "@/components/student/textbook-card";
import { useCourseProgress } from "@/components/student/use-course-progress";
import { useStudentScope } from "@/components/student/use-student-scope";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import { getCourseClient, getLessonsByChapterClient, getTextbookClient } from "@/lib/student/curriculum-client";
import { lessonProgressPercent, loadLessonProgress } from "@/lib/student/lesson-progress";
import {
  GUEST_LESSON_LIMIT,
  getGuestCompletedCount,
} from "@/lib/guest/guest-progress";

type CourseCurriculumProps = {
  courseId: string;
};

export function CourseCurriculum({ courseId }: CourseCurriculumProps) {
  const { isGuest } = useAuth();
  const studentScope = useStudentScope();
  const { store } = useContentStore();
  const course = getCourseClient(store, courseId);
  const textbook = getTextbookClient(store, courseId);
  const { percent, statuses } = useCourseProgress(
    course ?? { id: courseId, title: "", subject: "", description: "", lessons: [] },
  );
  const chapters = course ? getLessonsByChapterClient(course) : [];
  const completedCount = course
    ? course.lessons.filter((l) => statuses[l.id] === "complete").length
    : 0;

  if (!course) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        This course could not be found.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <LessonProgressRail
        percent={percent}
        stepLabel={`${completedCount} of ${course.lessons.length} lessons complete`}
        ariaLabel="Course progress"
      />

      <header className="space-y-2">
        <p className="text-sm font-medium text-sky-700 dark:text-stone-400">
          {course.subject}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          {course.title}
        </h1>
        <p className="max-w-2xl text-base text-slate-600 dark:text-stone-400">
          {course.description}
        </p>
      </header>

      {textbook && <TextbookCard textbook={textbook} />}

      {isGuest && (
        <p className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-700 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-300">
          Browsing as a guest — complete up to {GUEST_LESSON_LIMIT} Preview
          lessons ({getGuestCompletedCount()} of {GUEST_LESSON_LIMIT} used).
          Advanced lessons require an account.
        </p>
      )}

      <div className="space-y-10">
        {chapters.map(({ chapterId, chapterTitle, lessons }) => (
          <section key={chapterId} aria-labelledby={`chapter-${chapterId}`}>
            <h2
              id={`chapter-${chapterId}`}
              className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-stone-500"
            >
              {chapterTitle}
            </h2>
            <ol className="space-y-2">
              {lessons.map((lesson) => {
                const status = statuses[lesson.id] ?? "not_started";
                const stored = studentScope
                  ? loadLessonProgress(studentScope, course.id, lesson.id)
                  : null;
                const partialPercent =
                  status === "in_progress"
                    ? lessonProgressPercent(stored)
                    : undefined;

                return (
                  <CurriculumLessonRow
                    key={lesson.id}
                    courseId={course.id}
                    lesson={lesson}
                    status={status}
                    partialPercent={partialPercent}
                  />
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
