import { beforeEach, describe, expect, it } from "vitest";

import {
  MOCK_ADMIN_USERNAME,
  MOCK_USERNAME,
} from "@/lib/auth/constants";
import {
  activateSubscription,
  BILLING_CHECKOUT_ENABLED,
  BILLING_UNAVAILABLE_MESSAGE,
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

  it("does not grant access from mock checkout while billing is disabled", () => {
    expect(BILLING_CHECKOUT_ENABLED).toBe(false);
    expect(hasActiveSubscription("newuser@example.com")).toBe(false);

    expect(() =>
      activateSubscription("newuser@example.com", "monthly", {
        cardLast4: "4242",
      }),
    ).toThrow(BILLING_UNAVAILABLE_MESSAGE);

    expect(hasActiveSubscription("newuser@example.com")).toBe(false);
    expect(getSubscription("newuser@example.com")).toBeNull();
  });

  it("exposes plan catalog", () => {
    expect(SUBSCRIPTION_PLANS.monthly.price).toBeTruthy();
    expect(SUBSCRIPTION_PLANS.annual.badge).toBe("Best value");
  });
});
