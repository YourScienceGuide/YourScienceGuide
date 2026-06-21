import "server-only";

import {
  createDefaultStore,
  type AdminContentStore,
} from "@/lib/admin/content-store";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

const GLOBAL_CONTENT_ID = "global";

export type ContentStoreSource = "supabase" | "default";

export type ContentStoreLoadResult = {
  store: AdminContentStore;
  source: ContentStoreSource;
};

function isSupabaseConnectivityError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

  return (
    /fetch failed/i.test(message) ||
    /ENOTFOUND/i.test(message) ||
    /ECONNREFUSED/i.test(message) ||
    /ETIMEDOUT/i.test(message) ||
    /network error/i.test(message)
  );
}

function connectivityFallback(reason: unknown): ContentStoreLoadResult {
  console.warn(
    "Supabase unreachable (check NEXT_PUBLIC_SUPABASE_URL); using default content store.",
    reason instanceof Error ? reason.message : reason,
  );
  return { store: createDefaultStore(), source: "default" };
}

function normalizeStore(data: unknown): AdminContentStore {
  if (!data || typeof data !== "object") {
    return createDefaultStore();
  }

  const parsed = data as Partial<AdminContentStore>;
  if (!Array.isArray(parsed.courses) || parsed.courses.length === 0) {
    return createDefaultStore();
  }

  return {
    version: parsed.version === 1 ? 1 : 2,
    courses: parsed.courses,
    lessonQuestions: parsed.lessonQuestions ?? {},
    alcumusByLesson: parsed.alcumusByLesson ?? {},
    videos: parsed.videos ?? {},
  };
}

export async function loadContentStoreFromDatabase(): Promise<ContentStoreLoadResult> {
  if (!isSupabaseConfigured()) {
    return { store: createDefaultStore(), source: "default" };
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("content_store")
    .select("data")
    .eq("id", GLOBAL_CONTENT_ID)
    .maybeSingle();

  if (error) {
    if (isSupabaseConnectivityError(error)) {
      return connectivityFallback(error);
    }
    throw new Error(`Failed to load content store: ${error.message}`);
  }

  if (!data?.data) {
    const defaultStore = createDefaultStore();
    try {
      await saveContentStoreToDatabase(defaultStore);
      return { store: defaultStore, source: "supabase" };
    } catch (saveError) {
      if (isSupabaseConnectivityError(saveError)) {
        return connectivityFallback(saveError);
      }
      throw saveError;
    }
  }

  return { store: normalizeStore(data.data), source: "supabase" };
}

export async function saveContentStoreToDatabase(
  store: AdminContentStore,
): Promise<AdminContentStore> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const supabase = createSupabaseAdmin();
  const normalized = normalizeStore(store);
  const { error } = await supabase.from("content_store").upsert(
    {
      id: GLOBAL_CONTENT_ID,
      data: normalized,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`Failed to save content store: ${error.message}`);
  }

  return normalized;
}

export async function resetContentStoreInDatabase(): Promise<AdminContentStore> {
  const defaultStore = createDefaultStore();
  if (!isSupabaseConfigured()) {
    return defaultStore;
  }
  return saveContentStoreToDatabase(defaultStore);
}
