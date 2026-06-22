import { NextResponse } from "next/server";

import { requireAuthenticated } from "@/lib/auth/require-authenticated";
import {
  MAX_FAMILY_STUDENTS,
} from "@/lib/family/family-students.constants";
import {
  createFamilyStudent,
  listFamilyStudents,
} from "@/lib/family/family-students.server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAuthenticated();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      students: [],
      source: "unavailable",
      maxStudents: MAX_FAMILY_STUDENTS,
    });
  }

  try {
    const students = await listFamilyStudents(session.userId);
    return NextResponse.json(
      { students, source: "supabase", maxStudents: MAX_FAMILY_STUDENTS },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/family/students failed:", error);
    return NextResponse.json({ error: "Failed to load students" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAuthenticated();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Student profiles require Supabase to be configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { name?: string; displayName?: string };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Student name is required" }, { status: 400 });
    }

    const student = await createFamilyStudent(session.userId, {
      name: body.name,
      displayName: body.displayName,
    });

    return NextResponse.json({ student });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add student";
    console.error("POST /api/family/students failed:", error);
    const status = message.includes("up to") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
