"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { StripeBuyButton } from "@/components/parent/stripe-buy-button";
import { Button } from "@/components/ui/button";
import {
  BILLING_CHECKOUT_ENABLED,
  getSubscription,
  SUBSCRIPTION_PLANS,
} from "@/lib/billing/subscription";
import { cn } from "@/lib/utils";

const AUTH_RETURN_PATH = "/parent/billing";

export function BillingSection() {
  const { ready, isLoggedIn, username, hasLessonAccess } = useAuth();
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
            ? "Preview pricing below. Create an account to subscribe securely with Stripe."
            : "Preview planned pricing. Checkout is not open yet."
        }
      />

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
            </div>
          );
        })}
      </div>

      {BILLING_CHECKOUT_ENABLED ? (
        <div className="space-y-3 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
          {!ready ? (
            <p className="text-sm text-slate-600 dark:text-stone-400">
              Loading checkout…
            </p>
          ) : isLoggedIn ? (
            <>
              <p className="text-sm font-medium text-slate-900 dark:text-stone-50">
                Checkout with Stripe
              </p>
              <p className="text-sm text-slate-600 dark:text-stone-400">
                Payments are processed securely by Stripe. You will return here
                after checkout completes.
              </p>
              <StripeBuyButton />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
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
