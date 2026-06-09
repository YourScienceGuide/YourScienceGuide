import { NextResponse } from "next/server";

import { loadContentStoreFromDatabase } from "@/lib/admin/content-store.server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await loadContentStoreFromDatabase();
    return NextResponse.json(store, {
      headers: {
        "Cache-Control": "no-store",
        "X-YSG-Content-Source": isSupabaseConfigured() ? "supabase" : "default",
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
