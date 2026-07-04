import { NextResponse } from "next/server";

import { requireFamilyStudentAccess } from "@/lib/auth/require-authenticated";
import { createLongAnswerSubmission } from "@/lib/student/lesson-grades.server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Submissions are not available right now." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      familyStudentId?: string;
      courseId?: string;
      lessonId?: string;
      questionId?: string;
      promptExcerpt?: string;
      answerText?: string;
      maxPoints?: number;
    };

    if (
      !body.familyStudentId ||
      !body.courseId ||
      !body.lessonId ||
      !body.questionId ||
      !body.answerText?.trim()
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const access = await requireFamilyStudentAccess(body.familyStudentId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const submission = await createLongAnswerSubmission({
      familyStudentId: body.familyStudentId,
      courseId: body.courseId,
      lessonId: body.lessonId,
      questionId: body.questionId,
      promptExcerpt: body.promptExcerpt ?? "",
      answerText: body.answerText.trim(),
      maxPoints: body.maxPoints ?? 10,
    });

    return NextResponse.json({ id: submission.id });
  } catch (error) {
    console.error("POST /api/student/long-answer-submissions failed:", error);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
}
