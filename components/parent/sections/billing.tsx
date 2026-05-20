"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  activateSubscription,
  getSubscription,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/billing/subscription";
import { cn } from "@/lib/utils";

export function BillingSection() {
  const { username, hasLessonAccess, purchaseSubscription } = useAuth();
  const subscription = getSubscription(username);
  const [purchasing, setPurchasing] = useState<SubscriptionPlan | null>(null);
  const [justPurchased, setJustPurchased] = useState(false);

  function handlePurchase(plan: SubscriptionPlan) {
    if (!username) return;
    setPurchasing(plan);
    activateSubscription(username, plan);
    purchaseSubscription();
    setPurchasing(null);
    setJustPurchased(true);
    window.setTimeout(() => setJustPurchased(false), 3000);
  }

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
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              Active
            </span>
          </div>
          <div className="mt-8 border-t border-sky-100 pt-6 dark:border-stone-800">
            <Button type="button" variant="ghost">
              Manage payment method
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Get access"
        description="Purchase a subscription to unlock all courses and lessons for your students."
      />

      {justPurchased && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          Subscription activated. Your students can now open lessons from the
          Student area.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(["monthly", "annual"] as const).map((planId) => {
          const plan = SUBSCRIPTION_PLANS[planId];
          const isAnnual = planId === "annual";
          return (
            <div
              key={planId}
              className={cn(
                "relative flex flex-col rounded-lg border bg-white p-6 dark:bg-stone-900",
                isAnnual
                  ? "border-sky-400 ring-1 ring-sky-200 dark:border-stone-500 dark:ring-stone-700"
                  : "border-sky-200 dark:border-stone-700",
              )}
            >
              {"badge" in plan && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-stone-200 dark:text-stone-900">
                  {plan.badge}
                </span>
              )}
              <p className="text-sm font-medium text-sky-700 dark:text-stone-400">
                {plan.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
                {plan.price}
                <span className="text-base font-normal text-slate-500 dark:text-stone-500">
                  {" "}
                  {plan.interval}
                </span>
              </p>
              <p className="mt-3 flex-1 text-sm text-slate-600 dark:text-stone-400">
                {plan.description}
              </p>
              <Button
                type="button"
                className="mt-6 w-full"
                variant={isAnnual ? "default" : "outline"}
                disabled={purchasing !== null}
                onClick={() => handlePurchase(planId)}
              >
                {purchasing === planId
                  ? "Processing…"
                  : `Subscribe ${plan.label.toLowerCase()}`}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-slate-500 dark:text-stone-500">
        Mock checkout — no payment is collected. Subscriptions are stored on this
        device for demo purposes.
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
