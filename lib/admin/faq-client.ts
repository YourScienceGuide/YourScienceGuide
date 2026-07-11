import type { FaqContent } from "@/lib/faq/types";

export async function fetchFaqContentAdmin(): Promise<FaqContent> {
  const res = await fetch("/api/admin/faq", { cache: "no-store" });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to load FAQ");
  }
  return (await res.json()) as FaqContent;
}

export async function saveFaqContentAdmin(content: FaqContent): Promise<FaqContent> {
  const res = await fetch("/api/admin/faq", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to save FAQ");
  }
  return (await res.json()) as FaqContent;
}
