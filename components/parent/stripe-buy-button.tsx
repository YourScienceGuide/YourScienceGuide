"use client";

import Script from "next/script";

import {
  isStripeBuyButtonConfigured,
  STRIPE_BUY_BUTTON_ID,
  STRIPE_PUBLISHABLE_KEY,
} from "@/lib/billing/stripe";

export function StripeBuyButton() {
  if (!isStripeBuyButtonConfigured()) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
      >
        Stripe checkout is not configured. Set{" "}
        <code className="text-xs">NEXT_PUBLIC_STRIPE_BUY_BUTTON_ID</code> and{" "}
        <code className="text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>.
      </p>
    );
  }

  return (
    <div className="flex justify-center sm:justify-start">
      <Script
        src="https://js.stripe.com/v3/buy-button.js"
        strategy="afterInteractive"
      />
      <stripe-buy-button
        buy-button-id={STRIPE_BUY_BUTTON_ID}
        publishable-key={STRIPE_PUBLISHABLE_KEY}
      />
    </div>
  );
}
