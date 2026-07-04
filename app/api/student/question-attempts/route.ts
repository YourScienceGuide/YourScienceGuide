import { NextResponse } from "next/server";

import {
  requireAuthenticated,
  requireFamilyStudentAccess,
} from "@/lib/auth/require-authenticated";
import {
  getQuestionAttemptSummary,
  getQuestionAttemptSummaryForParent,
  insertQuestionAttempt,
  listQuestionAttempts,
  listQuestionAttemptsForParent,
} from "@/lib/student/question-history.server";
import type { RecordQuestionAttemptInput } from "@/lib/student/question-history.types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function parseOptional(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function GET(request: Request) {
  const session = await requireAuthenticated();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      attempts: [],
      summary: {
        totalAttempts: 0,
        correctAttempts: 0,
        incorrectAttempts: 0,
        accuracyPercent: 0,
      },
      source: "unavailable",
    });
  }

  const url = new URL(request.url);
  const familyStudentId = parseOptional(url.searchParams.get("familyStudentId"));
  const courseId = parseOptional(url.searchParams.get("courseId"));
  const lessonId = parseOptional(url.searchParams.get("lessonId"));

  try {
    if (familyStudentId) {
      const access = await requireFamilyStudentAccess(familyStudentId);
      if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
      }

      const query = { familyStudentId, courseId, lessonId };
      const [attempts, summary] = await Promise.all([
        listQuestionAttempts(query),
        getQuestionAttemptSummary(query),
      ]);

      return NextResponse.json(
        { attempts, summary, source: "supabase" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const [attempts, summary] = await Promise.all([
      listQuestionAttemptsForParent(session.userId, { courseId, lessonId }),
      getQuestionAttemptSummaryForParent(session.userId, { courseId, lessonId }),
    ]);

    return NextResponse.json(
      { attempts, summary, source: "supabase" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/student/question-attempts failed:", error);
    return NextResponse.json(
      { error: "Failed to load question history" },
      { status: 500 },
    );
  }
}

function isValidActivity(value: unknown): value is RecordQuestionAttemptInput["activity"] {
  return value === "assignment" || value === "alcumus";
}

export async function POST(request: Request) {
  const session = await requireAuthenticated();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Question history is not available right now." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as Partial<RecordQuestionAttemptInput>;

    if (
      !body.familyStudentId ||
      !body.courseId ||
      !body.lessonId ||
      !body.questionId ||
      !isValidActivity(body.activity) ||
      !body.questionType ||
      typeof body.isCorrect !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid attempt payload" }, { status: 400 });
    }

    const access = await requireFamilyStudentAccess(body.familyStudentId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const attempt = await insertQuestionAttempt(session.userId, body.familyStudentId, {
      familyStudentId: body.familyStudentId,
      courseId: body.courseId,
      lessonId: body.lessonId,
      questionId: body.questionId,
      activity: body.activity,
      questionType: body.questionType,
      promptExcerpt: body.promptExcerpt?.trim() ?? "",
      isCorrect: body.isCorrect,
    });

    return NextResponse.json({ attempt });
  } catch (error) {
    console.error("POST /api/student/question-attempts failed:", error);
    return NextResponse.json(
      { error: "Failed to save question attempt" },
      { status: 500 },
    );
  }
}
