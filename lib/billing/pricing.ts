import type { SubscriptionPlan } from "@/lib/billing/subscription";

export type BillingPlanInterval = "month" | "year";

export type BillingPlanRecord = {
  id: SubscriptionPlan;
  label: string;
  description: string;
  badge: string | null;
  amountCents: number;
  currency: string;
  interval: BillingPlanInterval;
  stripeProductId: string | null;
  stripePriceId: string | null;
};

/** Public/display shape used by /parent/billing. */
export type BillingPlanDisplay = {
  id: SubscriptionPlan;
  label: string;
  description: string;
  badge?: string;
  price: string;
  interval: string;
  amountCents: number;
};

export const DEFAULT_BILLING_PLANS: BillingPlanRecord[] = [
  {
    id: "monthly",
    label: "Monthly",
    description: "Full access to all courses and lessons. Cancel anytime.",
    badge: null,
    amountCents: 1999,
    currency: "usd",
    interval: "month",
    stripeProductId: null,
    stripePriceId: null,
  },
  {
    id: "annual",
    label: "Annual",
    description: "Save about 37% compared to monthly billing.",
    badge: "Best value",
    amountCents: 14999,
    currency: "usd",
    interval: "year",
    stripeProductId: null,
    stripePriceId: null,
  },
];

export function formatAmountCents(amountCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

export function intervalLabel(interval: BillingPlanInterval): string {
  return interval === "month" ? "per month" : "per year";
}

export function toBillingPlanDisplay(plan: BillingPlanRecord): BillingPlanDisplay {
  return {
    id: plan.id,
    label: plan.label,
    description: plan.description,
    ...(plan.badge ? { badge: plan.badge } : {}),
    price: formatAmountCents(plan.amountCents, plan.currency),
    interval: intervalLabel(plan.interval),
    amountCents: plan.amountCents,
  };
}

/** Parse a dollar string like "19.99" or "$19.99" into cents. */
export function parseDollarInputToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("-")) return null;
  const cleaned = trimmed.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const dollars = Number.parseFloat(cleaned);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
}

export function centsToDollarInput(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

export function validateBillingPlanDraft(plan: {
  id: string;
  label: string;
  description: string;
  amountCents: number;
}): string | null {
  if (plan.id !== "monthly" && plan.id !== "annual") {
    return "Invalid plan id.";
  }
  if (!plan.label.trim()) {
    return "Plan label is required.";
  }
  if (!Number.isInteger(plan.amountCents) || plan.amountCents <= 0) {
    return "Amount must be a positive dollar value.";
  }
  return null;
}
