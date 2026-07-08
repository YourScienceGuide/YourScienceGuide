import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { loadParentDailyEmailTemplate } from "@/lib/email/parent-daily-email-template.server";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { sampleDigestForPreview } from "@/lib/email/sample-parent-daily-digest";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const body = (await request.json()) as {
      subject?: string;
      body?: string;
    };
    const template = await loadParentDailyEmailTemplate();
    const { variables } = sampleDigestForPreview();

    const subject = renderEmailTemplate(body.subject ?? template.subject, variables);
    const text = renderEmailTemplate(body.body ?? template.body, variables);

    return NextResponse.json({ subject, text });
  } catch (error) {
    console.error("POST /api/admin/parent-daily-email/preview failed:", error);
    return NextResponse.json({ error: "Failed to preview email" }, { status: 500 });
  }
}
