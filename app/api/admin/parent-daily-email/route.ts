import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  loadParentDailyEmailTemplate,
  saveParentDailyEmailTemplate,
} from "@/lib/email/parent-daily-email-template.server";
import type { ParentDailyEmailTemplate } from "@/lib/email/default-parent-daily-template";
import { getEmailFromAddress, isEmailSendingConfigured } from "@/lib/email/send-email";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const template = await loadParentDailyEmailTemplate();
    return NextResponse.json({
      template,
      emailFrom: getEmailFromAddress(),
      sendingConfigured: isEmailSendingConfigured(),
    });
  } catch (error) {
    console.error("GET /api/admin/parent-daily-email failed:", error);
    return NextResponse.json({ error: "Failed to load email template" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const body = (await request.json()) as Partial<ParentDailyEmailTemplate>;
    if (!body.subject?.trim() || !body.body?.trim()) {
      return NextResponse.json(
        { error: "subject and body are required" },
        { status: 400 },
      );
    }

    const template = await saveParentDailyEmailTemplate({
      subject: body.subject,
      body: body.body,
      enabled: body.enabled ?? true,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("PUT /api/admin/parent-daily-email failed:", error);
    return NextResponse.json({ error: "Failed to save email template" }, { status: 500 });
  }
}
