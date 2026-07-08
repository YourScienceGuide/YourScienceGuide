import { NextResponse } from "next/server";

import { loadContentStoreFromDatabase } from "@/lib/admin/content-store.server";
import { getGradingConfigFromStore } from "@/lib/admin/content-store";
import { requireFamilyStudentAccess } from "@/lib/auth/require-authenticated";
import {
  maxLessonScore,
  rubricLineItems,
} from "@/lib/lesson/lesson-grade-config";
import {
  listLessonGradesForStudent,
  listPendingSubmissionsForStudent,
} from "@/lib/student/lesson-grades.server";
import { summarizeLessonGrades } from "@/lib/parent/summarize-lesson-grades";
import { getCourseFromStore } from "@/lib/admin/content-store";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function parseOptional(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function GET(request: Request) {
  const familyStudentId = parseOptional(
    new URL(request.url).searchParams.get("familyStudentId"),
  );
  const courseId = parseOptional(new URL(request.url).searchParams.get("courseId"));

  if (!familyStudentId) {
    return NextResponse.json({ error: "familyStudentId is required" }, { status: 400 });
  }

  const access = await requireFamilyStudentAccess(familyStudentId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const { store } = await loadContentStoreFromDatabase();
    const resolvedCourseId =
      courseId ?? store.courses[0]?.id ?? "";
    const course = getCourseFromStore(store, resolvedCourseId);
    const rubric = getGradingConfigFromStore(store, resolvedCourseId);
    const rubricItems = rubricLineItems(rubric);
    const maxScore = maxLessonScore(rubric);

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        source: "unavailable",
        courseId: resolvedCourseId,
        courseName: course?.title ?? "Course",
        rubric: { config: rubric, items: rubricItems, maxScore },
        lessonGrades: [],
        pendingSubmissions: [],
        totalEarnedPoints: 0,
        totalPossiblePoints: 0,
        courseProgress: 0,
      });
    }

    const [lessonGrades, allPendingSubmissions] = await Promise.all([
      listLessonGradesForStudent(familyStudentId, resolvedCourseId || undefined),
      listPendingSubmissionsForStudent(familyStudentId),
    ]);
    const pendingSubmissions = allPendingSubmissions.filter(
      (submission) => submission.courseId === resolvedCourseId,
    );

    const lessonCount = course?.lessons.length ?? 0;
    const { totalEarnedPoints, totalPossiblePoints, courseProgress } =
      summarizeLessonGrades(lessonGrades, lessonCount);

    return NextResponse.json({
      source: "supabase",
      courseId: resolvedCourseId,
      courseName: course?.title ?? "Course",
      rubric: { config: rubric, items: rubricItems, maxScore },
      lessonGrades,
      pendingSubmissions,
      totalEarnedPoints,
      totalPossiblePoints,
      courseProgress,
    });
  } catch (error) {
    console.error("GET /api/parent/student-progress failed:", error);
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
  }
}
