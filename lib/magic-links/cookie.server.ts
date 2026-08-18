import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

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

type MagicSessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

export function buildMagicSessionCookie(payload: MagicCookiePayload): {
  name: string;
  value: string;
  options: MagicSessionCookieOptions;
} {
  const secret = getMagicSigningSecret();
  if (!secret) {
    throw new Error("Magic link signing secret is not configured.");
  }
  const maxAge = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
  return {
    name: MAGIC_SESSION_COOKIE,
    value: encodeCookieValue(payload, secret),
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    },
  };
}

export function applyMagicSessionCookie(
  response: NextResponse,
  payload: MagicCookiePayload,
): NextResponse {
  const cookie = buildMagicSessionCookie(payload);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
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
  const cookie = buildMagicSessionCookie(payload);
  const store = await cookies();
  store.set(cookie.name, cookie.value, cookie.options);
}

export async function clearMagicSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(MAGIC_SESSION_COOKIE);
}
