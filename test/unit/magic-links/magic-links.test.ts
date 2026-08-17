import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { magicLinkAbsoluteUrl } from "@/lib/admin/magic-links-client";
import {
  evaluateMagicLinkAccess,
  isMagicLinkAccessMode,
  isMagicLinkToken,
  magicLinkStatus,
} from "@/lib/magic-links/access";
import {
  MAGIC_SESSION_COOKIE,
  createBrowserNonce,
  decodeCookieValue,
  encodeCookieValue,
  hashBrowserNonce,
  magicUserId,
} from "@/lib/magic-links/token";
import { MAGIC_LINK_EXPIRY_DAYS } from "@/lib/magic-links/types";

const secret = "test-secret";
const TOKEN = "550e8400-e29b-41d4-a716-446655440000";

function signPayload(payload: unknown, signingSecret = secret): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", signingSecret)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

describe("magic link tokens", () => {
  it("accepts UUID tokens and rejects other root paths", () => {
    expect(isMagicLinkToken(TOKEN)).toBe(true);
    expect(isMagicLinkToken(TOKEN.toUpperCase())).toBe(true);
    expect(isMagicLinkToken(`  ${TOKEN}  `)).toBe(true);
    expect(isMagicLinkToken("admin")).toBe(false);
    expect(isMagicLinkToken("student")).toBe(false);
    expect(isMagicLinkToken("sign-in")).toBe(false);
    expect(isMagicLinkToken("not-a-uuid")).toBe(false);
    expect(isMagicLinkToken("00000000-0000-0000-0000-000000000000")).toBe(false);
  });

  it("names the session cookie and synthetic user id", () => {
    expect(MAGIC_SESSION_COOKIE).toBe("ysg_magic_session");
    expect(magicUserId("link-1")).toBe("magic_link-1");
  });

  it("hashes browser nonces stably", () => {
    const nonce = createBrowserNonce();
    expect(hashBrowserNonce(nonce)).toBe(hashBrowserNonce(nonce));
    expect(hashBrowserNonce(nonce)).not.toBe(hashBrowserNonce("other"));
    expect(createBrowserNonce()).not.toBe(createBrowserNonce());
  });

  it("round-trips a signed cookie and rejects a bad signature", () => {
    const payload = {
      v: 1 as const,
      id: "link-1",
      n: createBrowserNonce(),
      exp: Math.floor(Date.now() / 1000) + 60,
    };
    const encoded = encodeCookieValue(payload, secret);
    expect(decodeCookieValue(encoded, secret)).toEqual(payload);
    expect(decodeCookieValue(`${encoded}tampered`, secret)).toBeNull();
    expect(decodeCookieValue(encoded, "other-secret")).toBeNull();
  });

  it("rejects expired, malformed, and incomplete cookies", () => {
    const nowMs = Date.UTC(2026, 7, 17, 18, 0, 0);
    expect(
      decodeCookieValue(
        encodeCookieValue(
          { v: 1, id: "link-1", n: "abc", exp: Math.floor(nowMs / 1000) },
          secret,
        ),
        secret,
        nowMs,
      ),
    ).toBeNull();
    expect(
      decodeCookieValue(
        encodeCookieValue(
          { v: 1, id: "link-1", n: "abc", exp: Math.floor(nowMs / 1000) + 1 },
          secret,
        ),
        secret,
        nowMs,
      ),
    ).toMatchObject({ id: "link-1" });

    expect(decodeCookieValue("", secret)).toBeNull();
    expect(decodeCookieValue("no-signature", secret)).toBeNull();
    expect(decodeCookieValue("body.", secret)).toBeNull();
    expect(
      decodeCookieValue(
        signPayload({ v: 2, id: "link-1", n: "abc", exp: 9_999_999_999 }),
        secret,
      ),
    ).toBeNull();
    expect(
      decodeCookieValue(
        signPayload({ v: 1, id: "", n: "abc", exp: 9_999_999_999 }),
        secret,
      ),
    ).toBeNull();
  });

  it("builds a site-root magic URL", () => {
    expect(magicLinkAbsoluteUrl(TOKEN, "https://yourscienceguide.com/")).toBe(
      `https://yourscienceguide.com/${TOKEN}`,
    );
    expect(magicLinkAbsoluteUrl(TOKEN, "https://yourscienceguide.com")).toBe(
      `https://yourscienceguide.com/${TOKEN}`,
    );
  });
});

describe("magic link access", () => {
  const nowMs = Date.UTC(2026, 7, 17, 18, 0, 0);
  const base = {
    disabledAt: null as string | null,
    expiresAt: new Date(nowMs + 60_000).toISOString(),
    accessMode: "anyone" as const,
    claimedBrowserHash: null as string | null,
  };

  it("offers 1, 7, 14, and 30 day expiries", () => {
    expect(MAGIC_LINK_EXPIRY_DAYS).toEqual([1, 7, 14, 30]);
  });

  it("accepts only the two access modes", () => {
    expect(isMagicLinkAccessMode("anyone")).toBe(true);
    expect(isMagicLinkAccessMode("first_browser")).toBe(true);
    expect(isMagicLinkAccessMode("admin")).toBe(false);
    expect(isMagicLinkAccessMode(null)).toBe(false);
  });

  it("marks disabled and expired links, with disable winning", () => {
    expect(magicLinkStatus(base, nowMs)).toBe("active");
    expect(
      magicLinkStatus(
        { ...base, expiresAt: new Date(nowMs).toISOString() },
        nowMs,
      ),
    ).toBe("expired");
    expect(
      magicLinkStatus(
        {
          ...base,
          disabledAt: new Date(nowMs).toISOString(),
          expiresAt: new Date(nowMs - 1000).toISOString(),
        },
        nowMs,
      ),
    ).toBe("disabled");
  });

  it("lets anyone redeem an open link", () => {
    expect(evaluateMagicLinkAccess(base, null, nowMs)).toEqual({
      ok: true,
      action: "open",
    });
  });

  it("rejects disabled and expired links even with a matching cookie", () => {
    const nonce = "browser-a";
    const claimed = {
      ...base,
      accessMode: "first_browser" as const,
      claimedBrowserHash: hashBrowserNonce(nonce),
    };
    expect(
      evaluateMagicLinkAccess(
        { ...claimed, disabledAt: new Date(nowMs).toISOString() },
        hashBrowserNonce(nonce),
        nowMs,
      ),
    ).toEqual({ ok: false, reason: "disabled" });
    expect(
      evaluateMagicLinkAccess(
        { ...claimed, expiresAt: new Date(nowMs).toISOString() },
        hashBrowserNonce(nonce),
        nowMs,
      ),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("binds first-browser links and rejects other browsers", () => {
    const nonce = createBrowserNonce();
    const unclaimed = {
      ...base,
      accessMode: "first_browser" as const,
    };
    expect(evaluateMagicLinkAccess(unclaimed, null, nowMs)).toEqual({
      ok: true,
      action: "claim",
    });

    const claimed = {
      ...unclaimed,
      claimedBrowserHash: hashBrowserNonce(nonce),
    };
    expect(evaluateMagicLinkAccess(claimed, hashBrowserNonce(nonce), nowMs)).toEqual({
      ok: true,
      action: "reuse",
    });
    expect(
      evaluateMagicLinkAccess(claimed, hashBrowserNonce("other-browser"), nowMs),
    ).toEqual({
      ok: false,
      reason: "claimed",
    });
    expect(evaluateMagicLinkAccess(claimed, null, nowMs)).toEqual({
      ok: false,
      reason: "claimed",
    });
  });

  it("ignores a claimed hash in anyone mode", () => {
    expect(
      evaluateMagicLinkAccess(
        {
          ...base,
          claimedBrowserHash: hashBrowserNonce("someone-else"),
        },
        null,
        nowMs,
      ),
    ).toEqual({ ok: true, action: "open" });
  });
});
