import "server-only";

import type { SubscriptionPlan } from "@/lib/billing/subscription";
import {
  DEFAULT_BILLING_PLANS,
  toBillingPlanDisplay,
  type BillingPlanDisplay,
  type BillingPlanInterval,
  type BillingPlanRecord,
  validateBillingPlanDraft,
} from "@/lib/billing/pricing";
import { getAppBaseUrl, getStripe, isStripeSecretConfigured } from "@/lib/billing/stripe.server";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

type BillingPlanRow = {
  id: string;
  label: string;
  description: string;
  badge: string | null;
  amount_cents: number;
  currency: string;
  interval: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
};

function mapRow(row: BillingPlanRow): BillingPlanRecord {
  return {
    id: row.id as SubscriptionPlan,
    label: row.label,
    description: row.description,
    badge: row.badge,
    amountCents: row.amount_cents,
    currency: row.currency,
    interval: row.interval as BillingPlanInterval,
    stripeProductId: row.stripe_product_id,
    stripePriceId: row.stripe_price_id,
  };
}

function isBillingStorageUnavailable(message: string): boolean {
  return /billing_plans/i.test(message) || /schema cache/i.test(message);
}

function defaultPlans(): BillingPlanRecord[] {
  return DEFAULT_BILLING_PLANS.map((plan) => ({ ...plan }));
}

function sortPlans(plans: BillingPlanRecord[]): BillingPlanRecord[] {
  const order: SubscriptionPlan[] = ["monthly", "annual"];
  return [...plans].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
  );
}

export async function loadBillingPlans(): Promise<BillingPlanRecord[]> {
  if (!isSupabaseConfigured()) {
    return defaultPlans();
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("billing_plans")
    .select(
      "id, label, description, badge, amount_cents, currency, interval, stripe_product_id, stripe_price_id",
    );

  if (error) {
    if (isBillingStorageUnavailable(error.message)) {
      console.warn(
        "billing_plans unavailable; using defaults.",
        error.message,
      );
      return defaultPlans();
    }
    throw new Error(`Failed to load billing plans: ${error.message}`);
  }

  if (!data?.length) {
    return defaultPlans();
  }

  return sortPlans(data.map(mapRow));
}

export async function loadBillingPlanDisplays(): Promise<BillingPlanDisplay[]> {
  const plans = await loadBillingPlans();
  return plans.map(toBillingPlanDisplay);
}

export type BillingPlanSaveInput = {
  id: SubscriptionPlan;
  label: string;
  description: string;
  badge: string | null;
  amountCents: number;
};

async function syncPlanToStripe(
  existing: BillingPlanRecord,
  next: BillingPlanSaveInput,
): Promise<Pick<BillingPlanRecord, "stripeProductId" | "stripePriceId">> {
  if (!isStripeSecretConfigured()) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY before saving pricing.",
    );
  }

  const stripe = getStripe();
  const productName = `Your Science Guide — ${next.label}`;
  let productId = existing.stripeProductId;

  if (!productId) {
    const product = await stripe.products.create({
      name: productName,
      description: next.description || undefined,
      metadata: { ysg_plan: next.id },
    });
    productId = product.id;
  } else {
    await stripe.products.update(productId, {
      name: productName,
      description: next.description || undefined,
    });
  }

  const amountChanged = existing.amountCents !== next.amountCents;
  const missingPrice = !existing.stripePriceId;
  let priceId = existing.stripePriceId;

  if (amountChanged || missingPrice) {
    const interval: BillingPlanInterval =
      next.id === "monthly" ? "month" : "year";
    const price = await stripe.prices.create({
      product: productId,
      currency: existing.currency || "usd",
      unit_amount: next.amountCents,
      recurring: { interval },
      metadata: { ysg_plan: next.id },
    });
    priceId = price.id;

    await stripe.products.update(productId, {
      default_price: priceId,
    });

    if (existing.stripePriceId && existing.stripePriceId !== priceId) {
      try {
        await stripe.prices.update(existing.stripePriceId, { active: false });
      } catch (error) {
        console.warn(
          "Failed to archive previous Stripe price:",
          existing.stripePriceId,
          error,
        );
      }
    }
  }

  return { stripeProductId: productId, stripePriceId: priceId };
}

export async function saveBillingPlans(
  inputs: BillingPlanSaveInput[],
): Promise<BillingPlanRecord[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  for (const input of inputs) {
    const error = validateBillingPlanDraft(input);
    if (error) throw new Error(error);
  }

  const existingPlans = await loadBillingPlans();
  const existingById = new Map(existingPlans.map((plan) => [plan.id, plan]));

  const synced: BillingPlanRecord[] = [];

  for (const input of inputs) {
    const existing =
      existingById.get(input.id) ??
      DEFAULT_BILLING_PLANS.find((plan) => plan.id === input.id);
    if (!existing) {
      throw new Error(`Unknown plan: ${input.id}`);
    }

    const stripeIds = await syncPlanToStripe(existing, input);
    const interval: BillingPlanInterval =
      input.id === "monthly" ? "month" : "year";

    synced.push({
      id: input.id,
      label: input.label.trim(),
      description: input.description.trim(),
      badge: input.badge?.trim() || null,
      amountCents: input.amountCents,
      currency: existing.currency || "usd",
      interval,
      stripeProductId: stripeIds.stripeProductId,
      stripePriceId: stripeIds.stripePriceId,
    });
  }

  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();
  const rows = synced.map((plan) => ({
    id: plan.id,
    label: plan.label,
    description: plan.description,
    badge: plan.badge,
    amount_cents: plan.amountCents,
    currency: plan.currency,
    interval: plan.interval,
    stripe_product_id: plan.stripeProductId,
    stripe_price_id: plan.stripePriceId,
    updated_at: now,
  }));

  const { error } = await supabase.from("billing_plans").upsert(rows);
  if (error) {
    throw new Error(`Failed to save billing plans: ${error.message}`);
  }

  return sortPlans(synced);
}

export async function createCheckoutSession(options: {
  planId: SubscriptionPlan;
  userId: string;
  customerEmail?: string | null;
}): Promise<{ url: string }> {
  if (!isStripeSecretConfigured()) {
    throw new Error("Stripe is not configured.");
  }

  const plans = await loadBillingPlans();
  const plan = plans.find((item) => item.id === options.planId);
  if (!plan?.stripePriceId) {
    throw new Error(
      "This plan is not ready for checkout. An admin must save pricing in the admin panel first.",
    );
  }

  const stripe = getStripe();
  const baseUrl = getAppBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${baseUrl}/parent/billing?checkout=success`,
    cancel_url: `${baseUrl}/parent/billing?checkout=canceled`,
    client_reference_id: options.userId,
    customer_email: options.customerEmail || undefined,
    metadata: {
      ysg_plan: options.planId,
      clerk_user_id: options.userId,
    },
    subscription_data: {
      metadata: {
        ysg_plan: options.planId,
        clerk_user_id: options.userId,
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return { url: session.url };
}
