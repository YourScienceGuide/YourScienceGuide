import { NextResponse } from "next/server";

import { loadPublishedFaqContent } from "@/lib/faq/faq.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await loadPublishedFaqContent();
    return NextResponse.json(content, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/faq failed:", error);
    return NextResponse.json({ error: "Failed to load FAQ" }, { status: 500 });
  }
}
