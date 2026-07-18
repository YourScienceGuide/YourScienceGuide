/** Stripe Buy Button embed (Dashboard → Product → Buy button). */
export const STRIPE_BUY_BUTTON_ID =
  process.env.NEXT_PUBLIC_STRIPE_BUY_BUTTON_ID ?? "";

export const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export function isStripeBuyButtonConfigured() {
  return Boolean(STRIPE_BUY_BUTTON_ID && STRIPE_PUBLISHABLE_KEY);
}
