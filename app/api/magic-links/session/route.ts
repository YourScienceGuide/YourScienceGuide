import { NextResponse } from "next/server";

import { clearMagicSessionCookie } from "@/lib/magic-links/cookie.server";
import { readMagicLinkSession } from "@/lib/magic-links/magic-links.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await readMagicLinkSession();
    if (!session) {
      return NextResponse.json({ active: false });
    }
    return NextResponse.json({
      active: true,
      label: session.label,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("GET /api/magic-links/session failed:", error);
    return NextResponse.json({ active: false });
  }
}

export async function DELETE() {
  await clearMagicSessionCookie();
  return NextResponse.json({ ok: true });
}
