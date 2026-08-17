import "server-only";

import { cookies } from "next/headers";

import {
  MAGIC_SESSION_COOKIE,
  decodeCookieValue,
  encodeCookieValue,
} from "@/lib/magic-links/token";
import type { MagicCookiePayload } from "@/lib/magic-links/types";

export function getMagicSigningSecret(): string | null {
  const secret =
    process.env.MAGIC_LINK_SECRET?.trim() ||
    process.env.CLERK_SECRET_KEY?.trim();
  return secret || null;
}

export async function readMagicCookiePayload(): Promise<MagicCookiePayload | null> {
  const secret = getMagicSigningSecret();
  if (!secret) return null;
  const store = await cookies();
  const raw = store.get(MAGIC_SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decodeCookieValue(raw, secret);
}

export async function writeMagicSessionCookie(payload: MagicCookiePayload): Promise<void> {
  const secret = getMagicSigningSecret();
  if (!secret) {
    throw new Error("Magic link signing secret is not configured.");
  }
  const maxAge = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
  const store = await cookies();
  store.set(MAGIC_SESSION_COOKIE, encodeCookieValue(payload, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearMagicSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(MAGIC_SESSION_COOKIE);
}
