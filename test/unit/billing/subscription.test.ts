import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MOCK_ADMIN_USERNAME,
  MOCK_USERNAME,
} from "@/lib/auth/constants";

describe("subscription billing (localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("grants demo accounts access", async () => {
    const { hasActiveSubscription, getSubscription } = await import(
      "@/lib/billing/subscription"
    );
    expect(hasActiveSubscription(MOCK_USERNAME)).toBe(true);
    expect(hasActiveSubscription(MOCK_ADMIN_USERNAME)).toBe(true);
    expect(getSubscription(MOCK_USERNAME)?.plan).toBe("annual");
  });

  it("grants access from checkout when billing is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_IS_BILLING_ENABLED", "true");
    const {
      activateSubscription,
      hasActiveSubscription,
      getSubscription,
      isBillingEnabled,
    } = await import("@/lib/billing/subscription");

    expect(isBillingEnabled()).toBe(true);
    expect(hasActiveSubscription("newuser@example.com")).toBe(false);

    activateSubscription("newuser@example.com", "monthly", {
      cardLast4: "4242",
    });

    expect(hasActiveSubscription("newuser@example.com")).toBe(true);
    expect(getSubscription("newuser@example.com")?.plan).toBe("monthly");
    expect(getSubscription("newuser@example.com")?.cardLast4).toBe("4242");
  });

  it("blocks mock checkout when billing is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_IS_BILLING_ENABLED", "false");
    const {
      activateSubscription,
      hasActiveSubscription,
      isBillingEnabled,
      BILLING_UNAVAILABLE_MESSAGE,
    } = await import("@/lib/billing/subscription");

    expect(isBillingEnabled()).toBe(false);
    expect(hasActiveSubscription("newuser@example.com")).toBe(false);
    expect(() =>
      activateSubscription("newuser@example.com", "monthly", {
        cardLast4: "4242",
      }),
    ).toThrow(BILLING_UNAVAILABLE_MESSAGE);
  });

  it("exposes plan catalog", async () => {
    const { SUBSCRIPTION_PLANS } = await import("@/lib/billing/subscription");
    expect(SUBSCRIPTION_PLANS.monthly.price).toBeTruthy();
    expect(SUBSCRIPTION_PLANS.annual.badge).toBe("Best value");
  });
});
