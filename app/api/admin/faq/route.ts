import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { loadFaqContent, saveFaqContent } from "@/lib/faq/faq.server";
import type { FaqContent } from "@/lib/faq/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const content = await loadFaqContent();
    return NextResponse.json(content);
  } catch (error) {
    console.error("GET /api/admin/faq failed:", error);
    return NextResponse.json({ error: "Failed to load FAQ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Saving is not available right now." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as Partial<FaqContent>;
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!Array.isArray(body.entries)) {
      return NextResponse.json({ error: "entries must be an array" }, { status: 400 });
    }

    const content = await saveFaqContent({
      title: body.title,
      intro: body.intro ?? "",
      entries: body.entries.map((entry, index) => ({
        id: entry.id?.trim() || `faq-${index}-${Date.now()}`,
        question: entry.question ?? "",
        answer: entry.answer ?? "",
        sortOrder: index,
        published: entry.published ?? true,
      })),
    });

    return NextResponse.json(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save FAQ";
    console.error("PUT /api/admin/faq failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
