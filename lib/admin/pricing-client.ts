import type { BillingPlanRecord } from "@/lib/billing/pricing";

export async function fetchPricingAdmin(): Promise<BillingPlanRecord[]> {
  const res = await fetch("/api/admin/pricing", { cache: "no-store" });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Failed to load pricing");
  }
  const data = (await res.json()) as { plans: BillingPlanRecord[] };
  return data.plans;
}

export async function savePricingAdmin(
  plans: Array<{
    id: string;
    label: string;
    description: string;
    badge: string | null;
    amountCents: number;
  }>,
): Promise<BillingPlanRecord[]> {
  const res = await fetch("/api/admin/pricing", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plans }),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Failed to save pricing");
  }
  const data = (await res.json()) as { plans: BillingPlanRecord[] };
  return data.plans;
}
