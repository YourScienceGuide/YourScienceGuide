import { describe, expect, it, vi } from "vitest";

describe("isBillingEnabled", () => {
  it("is true only when NEXT_PUBLIC_IS_BILLING_ENABLED=true", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_IS_BILLING_ENABLED", "true");
    const { isBillingEnabled } = await import("@/lib/billing/flags");
    expect(isBillingEnabled()).toBe(true);

    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_IS_BILLING_ENABLED", "false");
    const disabled = await import("@/lib/billing/flags");
    expect(disabled.isBillingEnabled()).toBe(false);

    vi.resetModules();
    vi.unstubAllEnvs();
    const unset = await import("@/lib/billing/flags");
    expect(unset.isBillingEnabled()).toBe(false);
  });
});
