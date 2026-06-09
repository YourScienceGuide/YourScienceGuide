"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CONTENT_UPDATED_EVENT,
  createDefaultStore,
  notifyContentUpdated,
  sanitizeContentStore,
  type AdminContentStore,
} from "@/lib/admin/content-store";

type ContentStoreContextValue = {
  store: AdminContentStore;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
  refresh: () => Promise<void>;
  persist: (next: AdminContentStore) => Promise<boolean>;
  reset: () => Promise<boolean>;
  source: "supabase" | "default" | "unknown";
};

const ContentStoreContext = createContext<ContentStoreContextValue | null>(null);

async function fetchContentStore(): Promise<{
  store: AdminContentStore;
  source: ContentStoreContextValue["source"];
}> {
  const res = await fetch("/api/content", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load content");
  }
  const store = sanitizeContentStore((await res.json()) as AdminContentStore);
  const sourceHeader = res.headers.get("X-YSG-Content-Source");
  const source =
    sourceHeader === "supabase" || sourceHeader === "default"
      ? sourceHeader
      : "unknown";
  return { store, source };
}

export function ContentStoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<AdminContentStore>(() => createDefaultStore());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [source, setSource] = useState<ContentStoreContextValue["source"]>("unknown");

  const refresh = useCallback(async () => {
    try {
      const result = await fetchContentStore();
      setStore(result.store);
      setSource(result.source);
      setError(null);
    } catch {
      setError("Could not load curriculum content. Showing defaults.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onUpdate = () => {
      void refresh();
    };
    window.addEventListener(CONTENT_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CONTENT_UPDATED_EVENT, onUpdate);
  }, [refresh]);

  const persist = useCallback(async (next: AdminContentStore) => {
    setSaving(true);
    setSaveError(null);
    const sanitized = sanitizeContentStore(next);

    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitized),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to save content");
      }

      const saved = sanitizeContentStore((await res.json()) as AdminContentStore);
      setStore(saved);
      setSource("supabase");
      notifyContentUpdated();
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save content");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const reset = useCallback(async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/admin/content?action=reset", {
        method: "POST",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to reset content");
      }

      const saved = sanitizeContentStore((await res.json()) as AdminContentStore);
      setStore(saved);
      setSource("supabase");
      notifyContentUpdated();
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to reset content");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      store,
      loading,
      saving,
      error,
      saveError,
      refresh,
      persist,
      reset,
      source,
    }),
    [store, loading, saving, error, saveError, refresh, persist, reset, source],
  );

  return (
    <ContentStoreContext.Provider value={value}>{children}</ContentStoreContext.Provider>
  );
}

export function useContentStore() {
  const ctx = useContext(ContentStoreContext);
  if (!ctx) {
    throw new Error("useContentStore must be used within ContentStoreProvider");
  }
  return ctx;
}
