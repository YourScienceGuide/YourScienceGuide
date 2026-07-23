import {
  MOCK_ADMIN_USERNAME,
  MOCK_USERNAME,
} from "@/lib/auth/constants";
import { isBillingEnabled } from "@/lib/billing/flags";

export { isBillingEnabled, BILLING_CHECKOUT_ENABLED } from "@/lib/billing/flags";

export const BILLING_UNAVAILABLE_MESSAGE =
  "Online payments are not available yet. Join the waitlist to be notified when registration opens.";

export type SubscriptionPlan = "monthly" | "annual";

export type SubscriptionRecord = {
  plan: SubscriptionPlan;
  activatedOn: string;
  expiresOn: string;
  cardLast4?: string;
  cardBrand?: string;
};

const STORAGE_KEY = "ysg-subscriptions";

type SubscriptionStore = Record<string, SubscriptionRecord>;

const DEMO_SUBSCRIBED = new Set([
  MOCK_USERNAME.toLowerCase(),
  MOCK_ADMIN_USERNAME.toLowerCase(),
]);

function readStore(): SubscriptionStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SubscriptionStore;
  } catch {
    return {};
  }
}

function writeStore(store: SubscriptionStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function accountKey(username: string) {
  return username.trim().toLowerCase();
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatExpiry(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function hasActiveSubscription(username: string | null): boolean {
  if (!username) return false;
  const key = accountKey(username);
  if (DEMO_SUBSCRIBED.has(key)) return true;
  if (!isBillingEnabled()) return false;
  return Boolean(readStore()[key]);
}

export function getSubscription(
  username: string | null,
): SubscriptionRecord | null {
  if (!username) return null;
  const key = accountKey(username);
  if (DEMO_SUBSCRIBED.has(key)) {
    return {
      plan: "annual",
      activatedOn: "January 1, 2026",
      expiresOn: "August 15, 2026",
    };
  }
  if (!isBillingEnabled()) return null;
  return readStore()[key] ?? null;
}

export function activateSubscription(
  username: string,
  plan: SubscriptionPlan,
  payment?: { cardLast4: string },
): SubscriptionRecord {
  if (!isBillingEnabled()) {
    throw new Error(BILLING_UNAVAILABLE_MESSAGE);
  }

  const key = accountKey(username);
  const now = new Date();
  const expires = addMonths(now, plan === "monthly" ? 1 : 12);
  const record: SubscriptionRecord = {
    plan,
    activatedOn: formatExpiry(now),
    expiresOn: formatExpiry(expires),
    cardLast4: payment?.cardLast4,
    cardBrand: "Visa",
  };
  const store = readStore();
  store[key] = record;
  writeStore(store);
  return record;
}

/** Fallback display catalog when API pricing is unavailable. */
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: "monthly" as const,
    label: "Monthly",
    price: "$19.99",
    interval: "per month",
    description: "Full access to all courses and lessons. Cancel anytime.",
  },
  annual: {
    id: "annual" as const,
    label: "Annual",
    price: "$149.99",
    interval: "per year",
    description: "Save about 37% compared to monthly billing.",
    badge: "Best value",
  },
} as const;
