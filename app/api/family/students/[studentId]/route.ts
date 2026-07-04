import { NextResponse } from "next/server";

import { requireAuthenticated } from "@/lib/auth/require-authenticated";
import {
  deleteFamilyStudent,
  updateFamilyStudent,
} from "@/lib/family/family-students.server";
import type { StudentPreferences } from "@/lib/family/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};

function isValidPreferences(value: unknown): value is StudentPreferences {
  if (!value || typeof value !== "object") return false;
  const prefs = value as StudentPreferences;
  return (
    typeof prefs.emailOnLessonComplete === "boolean" &&
    typeof prefs.emailOnGradingRequired === "boolean" &&
    typeof prefs.showGradeOnDashboard === "boolean"
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAuthenticated();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Student profiles are not available right now." },
      { status: 503 },
    );
  }

  const { studentId } = await context.params;

  try {
    const body = (await request.json()) as {
      name?: string;
      displayName?: string;
      preferences?: unknown;
    };

    const student = await updateFamilyStudent(session.userId, studentId, {
      name: body.name,
      displayName: body.displayName,
      preferences: isValidPreferences(body.preferences) ? body.preferences : undefined,
    });

    return NextResponse.json({ student });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update student";
    console.error("PATCH /api/family/students/[studentId] failed:", error);
    const status = message === "Student not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAuthenticated();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Student profiles are not available right now." },
      { status: 503 },
    );
  }

  const { studentId } = await context.params;

  try {
    await deleteFamilyStudent(session.userId, studentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove student";
    console.error("DELETE /api/family/students/[studentId] failed:", error);
    const status = message === "Student not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
