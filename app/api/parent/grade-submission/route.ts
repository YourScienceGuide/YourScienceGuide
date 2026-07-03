import { NextResponse } from "next/server";

import { requireAuthenticated } from "@/lib/auth/require-authenticated";
import {
  getSubmissionById,
  gradeLongAnswerSubmission,
} from "@/lib/student/lesson-grades.server";
import { getFamilyStudentById } from "@/lib/family/family-students.server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireAuthenticated();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Grading requires Supabase to be configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      submissionId?: string;
      parentScore?: number;
      parentFeedback?: string;
    };

    if (!body.submissionId || body.parentScore == null) {
      return NextResponse.json({ error: "submissionId and parentScore required" }, { status: 400 });
    }

    const score = Math.round(body.parentScore);
    if (!Number.isFinite(score) || score < 0 || score > 10) {
      return NextResponse.json({ error: "parentScore must be 0–10" }, { status: 400 });
    }

    const existing = await getSubmissionById(body.submissionId);
    if (!existing) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const student = await getFamilyStudentById(existing.familyStudentId);
    if (!student || student.parent_clerk_user_id !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submission = await gradeLongAnswerSubmission({
      submissionId: body.submissionId,
      parentScore: score,
      parentFeedback: body.parentFeedback,
    });

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("POST /api/parent/grade-submission failed:", error);
    return NextResponse.json({ error: "Failed to grade submission" }, { status: 500 });
  }
}
