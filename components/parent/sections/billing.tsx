"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_BILLING_PLANS,
  toBillingPlanDisplay,
  type BillingPlanDisplay,
} from "@/lib/billing/pricing";
import {
  BILLING_CHECKOUT_ENABLED,
  getSubscription,
  type SubscriptionPlan,
} from "@/lib/billing/subscription";
import { cn } from "@/lib/utils";

const AUTH_RETURN_PATH = "/parent/billing";

const DEFAULT_DISPLAY_PLANS = DEFAULT_BILLING_PLANS.map(toBillingPlanDisplay);

export function BillingSection() {
  const { ready, isLoggedIn, username, hasLessonAccess } = useAuth();
  const subscription = getSubscription(username);
  const [plans, setPlans] = useState<BillingPlanDisplay[]>(DEFAULT_DISPLAY_PLANS);
  const [plansLoading, setPlansLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPlans() {
      setPlansLoading(true);
      try {
        const res = await fetch("/api/pricing", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load pricing");
        const data = (await res.json()) as { plans: BillingPlanDisplay[] };
        if (!cancelled && data.plans?.length) {
          setPlans(data.plans);
        }
      } catch {
        if (!cancelled) setPlans(DEFAULT_DISPLAY_PLANS);
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    }
    void loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  const startCheckout = useCallback(async (planId: SubscriptionPlan) => {
    setCheckoutError(null);
    setCheckoutPlan(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const payload = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!res.ok || !payload?.url) {
        throw new Error(payload?.error ?? "Failed to start checkout");
      }
      window.location.assign(payload.url);
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Failed to start checkout",
      );
      setCheckoutPlan(null);
    }
  }, []);

  if (hasLessonAccess && subscription) {
    return (
      <div className="space-y-8">
        <SectionHeader
          title="Subscription & billing"
          description="Your family plan and payment details."
        />
        <div className="rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
                  Current plan
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-stone-50">
                  {subscription.plan === "monthly"
                    ? "Monthly access"
                    : "Annual access"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
                  Renews on
                </p>
                <p className="mt-1 text-base text-slate-700 dark:text-stone-300">
                  {subscription.expiresOn}
                </p>
              </div>
              {subscription.cardLast4 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
                    Payment method
                  </p>
                  <p className="mt-1 text-base text-slate-700 dark:text-stone-300">
                    {subscription.cardBrand ?? "Card"} ending in{" "}
                    {subscription.cardLast4}
                  </p>
                </div>
              )}
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              Active
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Get access"
        description={
          BILLING_CHECKOUT_ENABLED
            ? "Choose a plan below. Create an account to subscribe securely with Stripe."
            : "Preview planned pricing. Checkout is not open yet."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => {
          const isAnnual = plan.id === "annual";
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-lg border bg-white p-6 dark:bg-stone-900",
                isAnnual
                  ? "border-sky-400 ring-1 ring-sky-200 dark:border-stone-500 dark:ring-stone-700"
                  : "border-sky-200 dark:border-stone-700",
              )}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-stone-200 dark:text-stone-900">
                  {plan.badge}
                </span>
              )}
              <p className="text-sm font-medium text-sky-700 dark:text-stone-400">
                {plan.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
                {plansLoading ? "…" : plan.price}
                <span className="text-base font-normal text-slate-500 dark:text-stone-500">
                  {" "}
                  {plan.interval}
                </span>
              </p>
              <p className="mt-3 flex-1 text-sm text-slate-600 dark:text-stone-400">
                {plan.description}
              </p>
              {BILLING_CHECKOUT_ENABLED && ready && isLoggedIn ? (
                <Button
                  type="button"
                  className="mt-6 w-full"
                  variant={isAnnual ? "default" : "outline"}
                  disabled={checkoutPlan !== null}
                  onClick={() => void startCheckout(plan.id)}
                >
                  {checkoutPlan === plan.id
                    ? "Redirecting to Stripe…"
                    : `Subscribe ${plan.price}`}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>

      {BILLING_CHECKOUT_ENABLED && ready && !isLoggedIn ? (
        <div className="space-y-3 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
          <p className="text-sm font-medium text-slate-900 dark:text-stone-50">
            Account required to subscribe
          </p>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            Create a free account (or sign in) before checkout so your
            subscription can be linked to your family.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild>
              <Link
                href={`/sign-up?redirect_url=${encodeURIComponent(AUTH_RETURN_PATH)}`}
              >
                Create account
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/sign-in?redirect_url=${encodeURIComponent(AUTH_RETURN_PATH)}`}
              >
                Sign in
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {checkoutError ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {checkoutError}
        </p>
      ) : null}

      <p className="text-sm text-slate-500 dark:text-stone-500">
        Lesson access requires an active subscription. Demo accounts configured
        by your administrator may already have access.
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
        {title}
      </h2>
      <p className="text-sm text-slate-600 dark:text-stone-400">{description}</p>
    </div>
  );
}
