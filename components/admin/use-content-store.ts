"use client";

import { useCallback, useEffect, useState } from "react";

import {
  CONTENT_UPDATED_EVENT,
  loadContentStore,
  saveContentStore,
  type AdminContentStore,
} from "@/lib/admin/content-store";

export function useContentStore() {
  const [store, setStore] = useState<AdminContentStore>(() => loadContentStore());

  const refresh = useCallback(() => {
    setStore(loadContentStore());
  }, []);

  const persist = useCallback((next: AdminContentStore) => {
    saveContentStore(next);
    setStore(next);
  }, []);

  useEffect(() => {
    window.addEventListener(CONTENT_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CONTENT_UPDATED_EVENT, refresh);
  }, [refresh]);

  return { store, persist, refresh };
}
