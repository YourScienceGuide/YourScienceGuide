import { beforeEach, describe, expect, it } from "vitest";

import {
  MOCK_ADMIN_USERNAME,
  MOCK_USERNAME,
} from "@/lib/auth/constants";
import {
  activateSubscription,
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

  it("activates subscription for new users", () => {
    expect(hasActiveSubscription("newuser@example.com")).toBe(false);
    const record = activateSubscription("newuser@example.com", "monthly", {
      cardLast4: "4242",
    });
    expect(record.plan).toBe("monthly");
    expect(record.cardLast4).toBe("4242");
    expect(hasActiveSubscription("newuser@example.com")).toBe(true);
  });

  it("exposes plan catalog", () => {
    expect(SUBSCRIPTION_PLANS.monthly.price).toBeTruthy();
    expect(SUBSCRIPTION_PLANS.annual.badge).toBe("Best value");
  });
});
