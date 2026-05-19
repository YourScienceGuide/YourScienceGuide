"use client";

import { useCallback, useEffect, useState } from "react";

import type { Course } from "@/lib/student/curriculum";
import {
  getCourseCompletionPercent,
  getLessonStatusesForCourse,
  type LessonStatus,
} from "@/lib/student/lesson-progress";

const PROGRESS_EVENT = "ysg-lesson-progress-updated";

export function notifyProgressUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }
}

export function useCourseProgress(course: Course) {
  const [percent, setPercent] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, LessonStatus>>({});

  const refresh = useCallback(() => {
    setPercent(getCourseCompletionPercent(course));
    setStatuses(getLessonStatusesForCourse(course));
  }, [course]);

  useEffect(() => {
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return { percent, statuses, refresh };
}
