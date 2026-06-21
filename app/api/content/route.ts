import { NextResponse } from "next/server";

import { loadContentStoreFromDatabase } from "@/lib/admin/content-store.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { store, source } = await loadContentStoreFromDatabase();
    return NextResponse.json(store, {
      headers: {
        "Cache-Control": "no-store",
        "X-YSG-Content-Source": source,
      },
    });
  } catch (error) {
    console.error("GET /api/content failed:", error);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 },
    );
  }
}
