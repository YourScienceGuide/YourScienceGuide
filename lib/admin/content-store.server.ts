import "server-only";

import {
  createDefaultStore,
  type AdminContentStore,
} from "@/lib/admin/content-store";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

const GLOBAL_CONTENT_ID = "global";

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

export async function loadContentStoreFromDatabase(): Promise<AdminContentStore> {
  if (!isSupabaseConfigured()) {
    return createDefaultStore();
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("content_store")
    .select("data")
    .eq("id", GLOBAL_CONTENT_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load content store: ${error.message}`);
  }

  if (!data?.data) {
    const defaultStore = createDefaultStore();
    await saveContentStoreToDatabase(defaultStore);
    return defaultStore;
  }

  return normalizeStore(data.data);
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
