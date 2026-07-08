import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getEmailFromAddress,
  isEmailSendingConfigured,
  sendEmail,
} from "@/lib/email/send-email";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("email configuration helpers", () => {
  it("reads EMAIL_FROM when set", () => {
    process.env.EMAIL_FROM = "  Science Guide <notify@example.com>  ";
    expect(getEmailFromAddress()).toBe("Science Guide <notify@example.com>");
  });

  it("reports configured only when from address and API key exist", () => {
    expect(isEmailSendingConfigured()).toBe(false);

    process.env.EMAIL_FROM = "notify@example.com";
    expect(isEmailSendingConfigured()).toBe(false);

    process.env.RESEND_API_KEY = "re_test";
    expect(isEmailSendingConfigured()).toBe(true);
  });
});

describe("sendEmail", () => {
  it("returns not_configured when provider env vars are missing", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    const result = await sendEmail({
      to: "parent@example.com",
      from: "notify@example.com",
      subject: "Test",
      text: "Hello",
      html: "<p>Hello</p>",
    });

    expect(result).toEqual({ ok: false, reason: "not_configured" });
    expect(info).toHaveBeenCalled();
  });

  it("sends via Resend when configured", async () => {
    process.env.EMAIL_FROM = "notify@example.com";
    process.env.RESEND_API_KEY = "re_test";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendEmail({
      to: "parent@example.com",
      from: "notify@example.com",
      subject: "Daily progress",
      text: "Hello",
      html: "<p>Hello</p>",
    });

    expect(result).toEqual({ ok: true, provider: "resend", messageId: "email_123" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test",
        }),
      }),
    );
  });

  it("returns send_failed when Resend responds with an error", async () => {
    process.env.EMAIL_FROM = "notify@example.com";
    process.env.RESEND_API_KEY = "re_test";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "invalid from address",
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendEmail({
      to: "parent@example.com",
      from: "notify@example.com",
      subject: "Daily progress",
      text: "Hello",
      html: "<p>Hello</p>",
    });

    expect(result).toEqual({
      ok: false,
      reason: "send_failed",
      detail: "invalid from address",
    });
  });
});
