import { NextResponse } from "next/server";

import type { TemplateKind } from "@/lib/admin/xlsx-template.server";
import {
  buildQuestionTemplateXlsx,
  questionTemplateFilename,
} from "@/lib/admin/xlsx-template.server";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

function parseKind(value: string | null): TemplateKind | null {
  if (
    value === "chapter" ||
    value === "alcumus" ||
    value === "end-of-chapter" ||
    value === "flashcards" ||
    value === "review"
  ) {
    return value;
  }
  return null;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const kind = parseKind(new URL(request.url).searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json(
      {
        error:
          'Query param "kind" must be "chapter", "alcumus", "end-of-chapter", "flashcards", or "review".',
      },
      { status: 400 },
    );
  }

  try {
    const buffer = await buildQuestionTemplateXlsx(kind);
    const filename = questionTemplateFilename(kind);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/question-template failed:", error);
    return NextResponse.json(
      { error: "Failed to build template" },
      { status: 500 },
    );
  }
}
