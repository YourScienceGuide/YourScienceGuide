import { NextResponse } from "next/server";

import {
  sanitizeContentStore,
  type AdminContentStore,
} from "@/lib/admin/content-store";
import {
  loadContentStoreFromDatabase,
  resetContentStoreInDatabase,
  saveContentStoreToDatabase,
} from "@/lib/admin/content-store.server";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { SaveCmsScope } from "@/lib/cms/save-cms-scope";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseSaveScope(request: Request): SaveCmsScope {
  const url = new URL(request.url);
  return url.searchParams.get("scope") === "structure" ? "structure" : "full";
}

function saveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return "Failed to save content";
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const { store } = await loadContentStoreFromDatabase();
    return NextResponse.json(store, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/admin/content failed:", error);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Saving is not available right now. Please try again later.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as AdminContentStore;
    const scope = parseSaveScope(request);
    const store = await saveContentStoreToDatabase(sanitizeContentStore(body), {
      scope,
    });
    return NextResponse.json(store);
  } catch (error) {
    console.error("PUT /api/admin/content failed:", error);
    return NextResponse.json(
      { error: saveErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("action") !== "reset") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Saving is not available right now." },
      { status: 503 },
    );
  }

  try {
    const store = await resetContentStoreInDatabase();
    return NextResponse.json(store);
  } catch (error) {
    console.error("POST /api/admin/content?action=reset failed:", error);
    return NextResponse.json(
      { error: saveErrorMessage(error) },
      { status: 500 },
    );
  }
}
