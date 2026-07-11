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
import type { AdminFeedback } from "@/components/admin/admin-action-feedback";
import { formatSaveError } from "@/lib/admin/format-save-error";

export type PersistOptions = {
  /** Shown in the admin banner when save succeeds. */
  successMessage?: string;
  /** Skip success banner (use for auto-save field edits). Errors still show. */
  silent?: boolean;
};

export type PersistResult =
  | { ok: true }
  | { ok: false; error: string };

type ContentStoreContextValue = {
  store: AdminContentStore;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
  actionFeedback: AdminFeedback | null;
  clearActionFeedback: () => void;
  refresh: () => Promise<void>;
  persist: (
    next: AdminContentStore,
    options?: PersistOptions,
  ) => Promise<PersistResult>;
  reset: () => Promise<PersistResult>;
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
  const [actionFeedback, setActionFeedback] = useState<AdminFeedback | null>(null);
  const [source, setSource] = useState<ContentStoreContextValue["source"]>("unknown");

  const clearActionFeedback = useCallback(() => {
    setActionFeedback(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchContentStore();
      setStore(result.store);
      setSource(result.source);
      setError(null);
    } catch (err) {
      setError(formatSaveError(err).message);
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

  const persist = useCallback(
    async (
      next: AdminContentStore,
      options?: PersistOptions,
    ): Promise<PersistResult> => {
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
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? "Failed to save content");
        }

        const saved = sanitizeContentStore((await res.json()) as AdminContentStore);
        setStore(saved);
        setSource("supabase");
        notifyContentUpdated();

        if (!options?.silent) {
          setActionFeedback({
            type: "success",
            message: options?.successMessage ?? "Changes saved.",
          });
        }

        return { ok: true };
      } catch (err) {
        const formatted = formatSaveError(err);
        setSaveError(formatted.message);
        setActionFeedback({
          type: "error",
          message: formatted.message,
          tips: formatted.tips,
        });
        return { ok: false, error: formatted.message };
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const reset = useCallback(async (): Promise<PersistResult> => {
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/admin/content?action=reset", {
        method: "POST",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Failed to reset content");
      }

      const saved = sanitizeContentStore((await res.json()) as AdminContentStore);
      setStore(saved);
      setSource("supabase");
      notifyContentUpdated();
      setActionFeedback({
        type: "success",
        message: "All content reset to defaults.",
      });
      return { ok: true };
    } catch (err) {
      const formatted = formatSaveError(err);
      setSaveError(formatted.message);
      setActionFeedback({
        type: "error",
        message: formatted.message,
        tips: formatted.tips,
      });
      return { ok: false, error: formatted.message };
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
      actionFeedback,
      clearActionFeedback,
      refresh,
      persist,
      reset,
      source,
    }),
    [
      store,
      loading,
      saving,
      error,
      saveError,
      actionFeedback,
      clearActionFeedback,
      refresh,
      persist,
      reset,
      source,
    ],
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
