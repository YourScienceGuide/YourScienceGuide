import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  buildManualParentDailyEmailExport,
  formatCombinedManualParentEmails,
  formatManualParentEmailFile,
} from "@/lib/email/export-manual-parent-emails.server";

export const dynamic = "force-dynamic";

/**
 * Builds today's parent daily emails as plain text for manual Gmail sending.
 * Query: ?format=combined (default) | separate
 */
export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") === "separate" ? "separate" : "combined";
    const exportData = await buildManualParentDailyEmailExport();

    if (format === "separate") {
      return NextResponse.json({
        forDate: exportData.forDate,
        skipped: exportData.skipped,
        files: exportData.generated.map((draft) => ({
          filename: draft.filename,
          content: formatManualParentEmailFile(draft),
          to: draft.to,
          subject: draft.subject,
          studentName: draft.studentName,
        })),
      });
    }

    const content = formatCombinedManualParentEmails(exportData);
    const filename = `parent-daily-emails-${exportData.forDate}.txt`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-YSG-Email-Generated": String(exportData.generated.length),
        "X-YSG-Email-Skipped": String(exportData.skipped.length),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/parent-daily-email/export-manual failed:", error);
    return NextResponse.json(
      { error: "Failed to export parent emails" },
      { status: 500 },
    );
  }
}
