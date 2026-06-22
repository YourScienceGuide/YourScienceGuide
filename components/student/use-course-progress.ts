"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useActiveStudent } from "@/components/family/active-student-provider";
import { CONTENT_UPDATED_EVENT } from "@/lib/admin/content-store";
import type { Course } from "@/lib/student/curriculum-types";
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

export function useCourseProgress(course: Course) {
  const { isGuest } = useAuth();
  const { activeStudentId } = useActiveStudent();
  const studentScope = resolveStudentScope(activeStudentId, isGuest);
  const [percent, setPercent] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, LessonStatus>>({});

  const refresh = useCallback(() => {
    if (!studentScope) {
      setPercent(0);
      setStatuses({});
      return;
    }
    setPercent(getCourseCompletionPercent(course, studentScope));
    setStatuses(getLessonStatusesForCourse(course, studentScope));
  }, [course, studentScope]);

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
