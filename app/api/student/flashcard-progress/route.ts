import { NextResponse } from "next/server";

import { requireAuthenticated } from "@/lib/auth/require-authenticated";
import {
  recordFlashcardStudyEvent,
  upsertFlashcardDefinition,
} from "@/lib/student/flashcard-progress.server";
import { getFamilyStudentById } from "@/lib/family/family-students.server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireAuthenticated();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    const body = (await request.json()) as {
      familyStudentId?: string;
      courseId?: string;
      lessonId?: string;
      eventType?: "study" | "definition";
      cardId?: string;
      frontText?: string;
      definition?: string;
      isCorrect?: boolean;
    };

    if (
      !body.familyStudentId ||
      !body.courseId ||
      !body.lessonId ||
      !body.cardId ||
      !body.eventType
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const student = await getFamilyStudentById(body.familyStudentId);
    if (!student || student.parent_clerk_user_id !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (body.eventType === "study") {
      await recordFlashcardStudyEvent({
        familyStudentId: body.familyStudentId,
        courseId: body.courseId,
        lessonId: body.lessonId,
        cardId: body.cardId,
        frontText: body.frontText ?? "",
        isCorrect: Boolean(body.isCorrect),
      });
    } else {
      if (!body.definition?.trim()) {
        return NextResponse.json({ error: "definition required" }, { status: 400 });
      }
      await upsertFlashcardDefinition({
        familyStudentId: body.familyStudentId,
        courseId: body.courseId,
        lessonId: body.lessonId,
        cardId: body.cardId,
        frontText: body.frontText ?? "",
        definition: body.definition.trim(),
      });
    }

    return NextResponse.json({ ok: true, persisted: true });
  } catch (error) {
    console.error("POST /api/student/flashcard-progress failed:", error);
    return NextResponse.json({ error: "Failed to save flashcard progress" }, { status: 500 });
  }
}
