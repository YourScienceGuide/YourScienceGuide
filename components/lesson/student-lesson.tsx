"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useContentStore } from "@/components/admin/content-store-provider";
import { useActiveStudent } from "@/components/family/active-student-provider";
import { GradedLessonFlow } from "@/components/lesson/graded-lesson-flow";
import { useStudentScope } from "@/components/student/use-student-scope";
import { GuestLessonGuard } from "@/components/guest/guest-lesson-guard";
import { LessonNav } from "@/components/student/lesson-nav";
import { RequiredReadings } from "@/components/student/required-readings";
import { QuestionHistorySection } from "@/components/student/question-history-section";
import {
  getAdjacentLessonsClient,
  getCourseClient,
  getLessonClient,
  getTextbookClient,
} from "@/lib/student/curriculum-client";
import { getLessonReadings } from "@/lib/student/textbook";
import { useLessonAssessment } from "@/components/lesson/lesson-assessment-provider";
import { LessonVideo } from "@/components/lesson/lesson-video";
import { Button } from "@/components/ui/button";
import { lessonFlashcardsPath, lessonPracticePath } from "@/lib/student/paths";

type StudentLessonProps = {
  courseId: string;
  lessonId: string;
};

export function StudentLesson({ courseId, lessonId }: StudentLessonProps) {
  const { isGuest } = useAuth();
  const studentScope = useStudentScope();
  const { activeStudentId } = useActiveStudent();
  const { store } = useContentStore();
  const [canAccessLesson, setCanAccessLesson] = useState(false);
  const course = getCourseClient(store, courseId);
  const lessonMeta = getLessonClient(store, courseId, lessonId);
  const textbook = getTextbookClient(store, courseId);
  const readings = getLessonReadings(lessonId);
  const { prev, next } = getAdjacentLessonsClient(store, courseId, lessonId);
  const { practice, ready, error } = useLessonAssessment();

  useEffect(() => {
    setCanAccessLesson(false);
  }, [lessonId]);

  if (!course || !lessonMeta) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        This lesson could not be found.
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  if (!ready || !studentScope) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading lesson…
      </p>
    );
  }

  const hasExtraPractice = practice.length > 0;
  const familyStudentId = isGuest ? null : activeStudentId;

  return (
    <GuestLessonGuard courseId={courseId} lessonId={lessonId}>
      <div className="space-y-10">
        <LessonNav
          courseId={courseId}
          courseTitle={course.title}
          lesson={lessonMeta}
          prev={prev}
          next={next}
        />

        <p className="text-base text-slate-600 dark:text-stone-400">
          Complete review questions, watch the video, then work through each section
          of the lesson.
        </p>

        <GradedLessonFlow
          studentScope={studentScope}
          familyStudentId={familyStudentId}
          courseId={courseId}
          lessonId={lessonId}
          onAccessChange={setCanAccessLesson}
        >
          {canAccessLesson ? (
            <>
              {textbook && readings.length > 0 && (
                <RequiredReadings textbook={textbook} readings={readings} />
              )}
              <LessonVideo courseId={courseId} lessonId={lessonId} />
            </>
          ) : (
            <div className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-4 text-sm text-slate-700 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-300">
              <p className="font-medium text-slate-900 dark:text-stone-50">
                Video and readings locked
              </p>
              <p className="mt-1">
                Finish the review questions above to unlock the video and readings.
              </p>
            </div>
          )}
        </GradedLessonFlow>

        {canAccessLesson && (
          <>
            <section
              className="rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900"
              aria-labelledby="extra-practice-heading"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h2
                    id="extra-practice-heading"
                    className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
                  >
                    Bonus extra practice
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-stone-400">
                    Optional harder problems — not required to finish the lesson.
                  </p>
                </div>
                {hasExtraPractice ? (
                  <Button asChild className="shrink-0">
                    <Link href={lessonPracticePath(courseId, lessonId)}>
                      Bonus practice
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-stone-400 sm:text-right">
                    No bonus practice for this section.
                  </p>
                )}
              </div>
            </section>

            <QuestionHistorySection
              courseId={courseId}
              lessonId={lessonId}
              title="Your question history"
              description="Attempts for this lesson."
            />

            <section
              className="rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900"
              aria-labelledby="flashcard-review-heading"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h2
                    id="flashcard-review-heading"
                    className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
                  >
                    Flashcard Review
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-stone-400">
                    Optional spaced repetition — not required to finish the lesson.
                  </p>
                </div>
                <Button asChild className="shrink-0">
                  <Link href={lessonFlashcardsPath(courseId, lessonId)}>
                    Flashcard Review
                  </Link>
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </GuestLessonGuard>
  );
}
