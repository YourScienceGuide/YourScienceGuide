"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  BILLING_CHECKOUT_ENABLED,
  BILLING_UNAVAILABLE_MESSAGE,
  getSubscription,
  SUBSCRIPTION_PLANS,
} from "@/lib/billing/subscription";
import { cn } from "@/lib/utils";

export function BillingSection() {
  const { username, hasLessonAccess } = useAuth();
  const subscription = getSubscription(username);

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
          {!BILLING_CHECKOUT_ENABLED && (
            <p className="mt-6 border-t border-sky-100 pt-6 text-sm text-slate-600 dark:border-stone-800 dark:text-stone-400">
              {BILLING_UNAVAILABLE_MESSAGE} Payment method changes will be
              available when billing launches.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Get access"
        description="Preview planned pricing. Checkout is not open yet."
      />

      <div
        role="status"
        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
      >
        {BILLING_UNAVAILABLE_MESSAGE}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(["monthly", "annual"] as const).map((planId) => {
          const plan = SUBSCRIPTION_PLANS[planId];
          const isAnnual = planId === "annual";
          return (
            <div
              key={planId}
              className={cn(
                "relative flex flex-col rounded-lg border bg-white p-6 opacity-90 dark:bg-stone-900",
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
                disabled
              >
                Coming in a future release
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-slate-500 dark:text-stone-500">
        Lesson access for new accounts will require a paid subscription once
        billing is live. Demo accounts configured by your administrator may
        already have access.
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
