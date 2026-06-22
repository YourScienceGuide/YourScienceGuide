import { NextResponse } from "next/server";

import { uploadTextbookCover } from "@/lib/cms/textbook-covers.server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const courseId = form.get("courseId");
    const file = form.get("file");

    if (typeof courseId !== "string" || !courseId.trim()) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const url = await uploadTextbookCover(courseId.trim(), file);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload cover";
    console.error("POST /api/admin/textbook-cover failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
