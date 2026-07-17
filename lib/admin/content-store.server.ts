import "server-only";

import {
  createDefaultStore,
  sanitizeContentStore,
  type AdminContentStore,
} from "@/lib/admin/content-store";
import {
  cmsHasContent,
  loadCmsAsStore,
  loadLegacyContentBlob,
  seedDefaultCms,
} from "@/lib/cms/load-cms";
import {
  resetCmsToDefault,
  saveCmsFromStore,
} from "@/lib/cms/save-cms";
import type { SaveCmsScope } from "@/lib/cms/save-cms-scope";
import { isSupabaseConfigured } from "@/lib/supabase/server";

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
    /network error/i.test(message) ||
    /Failed to load CMS/i.test(message)
  );
}

function connectivityFallback(reason: unknown): ContentStoreLoadResult {
  console.warn(
    "Supabase unreachable (check NEXT_PUBLIC_SUPABASE_URL); using default content store.",
    reason instanceof Error ? reason.message : reason,
  );
  return { store: createDefaultStore(), source: "default" };
}

async function migrateLegacyBlobIfNeeded(): Promise<AdminContentStore | null> {
  const legacy = await loadLegacyContentBlob();
  if (!legacy) return null;

  console.info("Migrating legacy content_store JSON blob into normalized CMS tables…");
  await saveCmsFromStore(legacy);
  return loadCmsAsStore();
}

export async function loadContentStoreFromDatabase(): Promise<ContentStoreLoadResult> {
  if (!isSupabaseConfigured()) {
    return { store: createDefaultStore(), source: "default" };
  }

  try {
    if (await cmsHasContent()) {
      return { store: await loadCmsAsStore(), source: "supabase" };
    }

    const migrated = await migrateLegacyBlobIfNeeded();
    if (migrated) {
      return { store: migrated, source: "supabase" };
    }

    const store = await seedDefaultCms();
    return { store, source: "supabase" };
  } catch (error) {
    if (isSupabaseConnectivityError(error)) {
      return connectivityFallback(error);
    }
    throw error;
  }
}

export async function saveContentStoreToDatabase(
  store: AdminContentStore,
  options?: { scope?: SaveCmsScope },
): Promise<AdminContentStore> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const sanitized = sanitizeContentStore(store);
  await saveCmsFromStore(sanitized, { scope: options?.scope ?? "full" });
  return sanitized;
}

export async function resetContentStoreInDatabase(): Promise<AdminContentStore> {
  const defaultStore = createDefaultStore();
  if (!isSupabaseConfigured()) {
    return defaultStore;
  }

  await resetCmsToDefault(defaultStore);
  return sanitizeContentStore(defaultStore);
}
