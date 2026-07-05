"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useActiveStudent } from "@/components/family/active-student-provider";
import { CONTENT_UPDATED_EVENT } from "@/lib/admin/content-store";
import type { Course } from "@/lib/student/curriculum-types";
import type { GradingRubricConfig } from "@/lib/lesson/lesson-grade-config";
import {
  getCourseCompletionPercent,
  getLessonStatusesForCourse,
  type LessonStatus,
} from "@/lib/student/lesson-progress";
import { resolveStudentScope } from "@/lib/student/student-scope";

const PROGRESS_EVENT = "ysg-lesson-progress-updated";

export function notifyProgressUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }
}

function lessonStatusesEqual(
  left: Record<string, LessonStatus>,
  right: Record<string, LessonStatus>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => left[key] === right[key]);
}

export function useCourseProgress(course: Course, rubric?: GradingRubricConfig) {
  const { isGuest } = useAuth();
  const { activeStudentId } = useActiveStudent();
  const studentScope = resolveStudentScope(activeStudentId, isGuest);
  const [percent, setPercent] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, LessonStatus>>({});

  const lessonIdsKey = useMemo(
    () => course.lessons.map((lesson) => lesson.id).join(","),
    [course.lessons],
  );

  const refresh = useCallback(() => {
    if (!studentScope) {
      setPercent((current) => (current === 0 ? current : 0));
      setStatuses((current) =>
        Object.keys(current).length === 0 ? current : {},
      );
      return;
    }
    const nextPercent = getCourseCompletionPercent(course, studentScope, rubric);
    const nextStatuses = getLessonStatusesForCourse(course, studentScope);
    setPercent((current) => (current === nextPercent ? current : nextPercent));
    setStatuses((current) =>
      lessonStatusesEqual(current, nextStatuses) ? current : nextStatuses,
    );
  }, [course, lessonIdsKey, rubric, studentScope]);

  useEffect(() => {
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener(CONTENT_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener(CONTENT_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return { percent, statuses, refresh };
}
