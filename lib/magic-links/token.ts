import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { MagicCookiePayload } from "@/lib/magic-links/types";

export const MAGIC_SESSION_COOKIE = "ysg_magic_session";

export function magicUserId(linkId: string): string {
  return `magic_${linkId}`;
}

export function hashBrowserNonce(nonce: string): string {
  return createHash("sha256").update(nonce).digest("hex");
}

export function createBrowserNonce(): string {
  return randomBytes(16).toString("hex");
}

export function encodeCookieValue(
  payload: MagicCookiePayload,
  secret: string,
): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signBody(body, secret);
  return `${body}.${signature}`;
}

export function decodeCookieValue(
  value: string,
  secret: string,
  nowMs = Date.now(),
): MagicCookiePayload | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expected = signBody(body, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as MagicCookiePayload;
    if (parsed.v !== 1 || !parsed.id || !parsed.n || typeof parsed.exp !== "number") {
      return null;
    }
    if (parsed.exp * 1000 <= nowMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

function signBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
