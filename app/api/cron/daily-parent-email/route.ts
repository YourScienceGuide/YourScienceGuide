import { NextResponse } from "next/server";

import { isCronRequestAuthorized } from "@/lib/email/cron-auth";
import { sendDailyParentEmails } from "@/lib/email/send-daily-parent-emails";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await sendDailyParentEmails();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("GET /api/cron/daily-parent-email failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
