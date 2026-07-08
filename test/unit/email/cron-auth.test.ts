import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isCronRequestAuthorized } from "@/lib/email/cron-auth";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.CRON_SECRET = "cron-secret";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

function requestWithHeaders(headers: Record<string, string>): Request {
  return new Request("https://example.com/api/cron/daily-parent-email", {
    headers,
  });
}

describe("isCronRequestAuthorized", () => {
  it("rejects requests when CRON_SECRET is unset", () => {
    delete process.env.CRON_SECRET;
    const request = requestWithHeaders({
      authorization: "Bearer cron-secret",
    });
    expect(isCronRequestAuthorized(request)).toBe(false);
  });

  it("accepts bearer authorization", () => {
    const request = requestWithHeaders({
      authorization: "Bearer cron-secret",
    });
    expect(isCronRequestAuthorized(request)).toBe(true);
  });

  it("accepts x-cron-secret header", () => {
    const request = requestWithHeaders({
      "x-cron-secret": "cron-secret",
    });
    expect(isCronRequestAuthorized(request)).toBe(true);
  });

  it("rejects missing or incorrect credentials", () => {
    expect(isCronRequestAuthorized(requestWithHeaders({}))).toBe(false);
    expect(
      isCronRequestAuthorized(
        requestWithHeaders({ authorization: "Bearer wrong-secret" }),
      ),
    ).toBe(false);
  });
});
