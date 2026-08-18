import { NextRequest, NextResponse } from "next/server";

import { isMagicLinkToken } from "@/lib/magic-links/access";
import { applyMagicSessionCookie } from "@/lib/magic-links/cookie.server";
import { redeemMagicLink } from "@/lib/magic-links/magic-links.server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!isMagicLinkToken(token)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const result = await redeemMagicLink(token);
  if (!result.ok) {
    const errorUrl = new URL(`/${token}`, request.url);
    errorUrl.searchParams.set("reason", result.reason);
    return NextResponse.redirect(errorUrl);
  }

  const response = NextResponse.redirect(new URL("/student", request.url));
  applyMagicSessionCookie(response, result.cookie);
  return response;
}
