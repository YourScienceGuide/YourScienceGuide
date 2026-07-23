import { describe, expect, it } from "vitest";

import {
  centsToDollarInput,
  formatAmountCents,
  intervalLabel,
  parseDollarInputToCents,
  toBillingPlanDisplay,
  validateBillingPlanDraft,
  DEFAULT_BILLING_PLANS,
} from "@/lib/billing/pricing";

describe("billing pricing helpers", () => {
  it("formats cents as currency", () => {
    expect(formatAmountCents(1999)).toBe("$19.99");
    expect(formatAmountCents(14999)).toBe("$149.99");
  });

  it("parses dollar input to cents", () => {
    expect(parseDollarInputToCents("19.99")).toBe(1999);
    expect(parseDollarInputToCents("$149.99")).toBe(14999);
    expect(parseDollarInputToCents("0")).toBeNull();
    expect(parseDollarInputToCents("")).toBeNull();
    expect(parseDollarInputToCents("-5")).toBeNull();
  });

  it("round-trips cents to dollar input", () => {
    expect(centsToDollarInput(1999)).toBe("19.99");
    expect(parseDollarInputToCents(centsToDollarInput(14999))).toBe(14999);
  });

  it("builds display plans with interval labels", () => {
    expect(intervalLabel("month")).toBe("per month");
    expect(intervalLabel("year")).toBe("per year");

    const annual = toBillingPlanDisplay(DEFAULT_BILLING_PLANS[1]!);
    expect(annual.price).toBe("$149.99");
    expect(annual.interval).toBe("per year");
    expect(annual.badge).toBe("Best value");
  });

  it("validates plan drafts", () => {
    expect(
      validateBillingPlanDraft({
        id: "monthly",
        label: "Monthly",
        description: "Access",
        amountCents: 1999,
      }),
    ).toBeNull();

    expect(
      validateBillingPlanDraft({
        id: "monthly",
        label: "",
        description: "Access",
        amountCents: 1999,
      }),
    ).toMatch(/label/i);

    expect(
      validateBillingPlanDraft({
        id: "annual",
        label: "Annual",
        description: "Access",
        amountCents: 0,
      }),
    ).toMatch(/amount/i);
  });
});
