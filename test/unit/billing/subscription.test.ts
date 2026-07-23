import { beforeEach, describe, expect, it } from "vitest";

import {
  MOCK_ADMIN_USERNAME,
  MOCK_USERNAME,
} from "@/lib/auth/constants";
import {
  activateSubscription,
  BILLING_CHECKOUT_ENABLED,
  getSubscription,
  hasActiveSubscription,
  SUBSCRIPTION_PLANS,
} from "@/lib/billing/subscription";

describe("subscription billing (localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("grants demo accounts access", () => {
    expect(hasActiveSubscription(MOCK_USERNAME)).toBe(true);
    expect(hasActiveSubscription(MOCK_ADMIN_USERNAME)).toBe(true);
    expect(getSubscription(MOCK_USERNAME)?.plan).toBe("annual");
  });

  it("grants access from checkout when billing is enabled", () => {
    expect(BILLING_CHECKOUT_ENABLED).toBe(true);
    expect(hasActiveSubscription("newuser@example.com")).toBe(false);

    activateSubscription("newuser@example.com", "monthly", {
      cardLast4: "4242",
    });

    expect(hasActiveSubscription("newuser@example.com")).toBe(true);
    expect(getSubscription("newuser@example.com")?.plan).toBe("monthly");
    expect(getSubscription("newuser@example.com")?.cardLast4).toBe("4242");
  });

  it("exposes plan catalog", () => {
    expect(SUBSCRIPTION_PLANS.monthly.price).toBeTruthy();
    expect(SUBSCRIPTION_PLANS.annual.badge).toBe("Best value");
  });
});
