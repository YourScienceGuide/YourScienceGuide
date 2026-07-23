/**
 * Env-backed billing feature flag.
 * Set NEXT_PUBLIC_IS_BILLING_ENABLED=true to enable Stripe checkout on /parent/billing.
 * When false/unset, the waitlist UI is shown instead.
 */
export function isBillingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_IS_BILLING_ENABLED === "true";
}

/** @deprecated Prefer isBillingEnabled() — kept for existing call sites. */
export const BILLING_CHECKOUT_ENABLED = isBillingEnabled();
