import {
  sanitizeContentStore,
  type AdminContentStore,
} from "@/lib/admin/content-store";
import { formatSaveError } from "@/lib/admin/format-save-error";

export type PersistAdminContentResult =
  | { ok: true; store: AdminContentStore }
  | { ok: false; error: string; tips: string[] };

export async function persistAdminContent(
  next: AdminContentStore,
): Promise<PersistAdminContentResult> {
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
    return { ok: true, store: saved };
  } catch (err) {
    const formatted = formatSaveError(err);
    return { ok: false, error: formatted.message, tips: formatted.tips };
  }
}

export type ResetAdminContentResult =
  | { ok: true; store: AdminContentStore }
  | { ok: false; error: string; tips: string[] };

export async function resetAdminContent(): Promise<ResetAdminContentResult> {
  try {
    const res = await fetch("/api/admin/content?action=reset", {
      method: "POST",
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Failed to reset content");
    }

    const saved = sanitizeContentStore((await res.json()) as AdminContentStore);
    return { ok: true, store: saved };
  } catch (err) {
    const formatted = formatSaveError(err);
    return { ok: false, error: formatted.message, tips: formatted.tips };
  }
}
