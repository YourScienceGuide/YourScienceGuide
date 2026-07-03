import { NextResponse } from "next/server";

import { requireFamilyStudentAccess } from "@/lib/auth/require-authenticated";
import { upsertLessonGrade } from "@/lib/student/lesson-grades.server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, source: "unavailable" });
  }

  try {
    const body = (await request.json()) as {
      familyStudentId?: string;
      courseId?: string;
      lessonId?: string;
      earnedPoints?: number;
      possiblePoints?: number;
      percent?: number;
      problemsSolved?: number;
      graduated?: boolean;
      scoreBreakdown?: Record<string, number>;
      phaseProgress?: Record<string, unknown>;
    };

    if (!body.familyStudentId || !body.courseId || !body.lessonId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const access = await requireFamilyStudentAccess(body.familyStudentId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    await upsertLessonGrade({
      familyStudentId: body.familyStudentId,
      courseId: body.courseId,
      lessonId: body.lessonId,
      earnedPoints: body.earnedPoints ?? 0,
      possiblePoints: body.possiblePoints ?? 0,
      percent: body.percent ?? 0,
      problemsSolved: body.problemsSolved ?? 0,
      graduated: body.graduated ?? false,
      scoreBreakdown: body.scoreBreakdown as never,
      phaseProgress: body.phaseProgress as never,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/student/lesson-grade failed:", error);
    return NextResponse.json({ error: "Failed to save lesson grade" }, { status: 500 });
  }
}
