import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { isMagicLinkAccessMode } from "@/lib/magic-links/access";
import {
  createMagicLink,
  listMagicLinks,
} from "@/lib/magic-links/magic-links.server";
import {
  MAGIC_LINK_EXPIRY_DAYS,
  type MagicLinkExpiryDays,
} from "@/lib/magic-links/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const links = await listMagicLinks();
    return NextResponse.json({ links });
  } catch (error) {
    console.error("GET /api/admin/magic-links failed:", error);
    return NextResponse.json(
      { error: "Failed to load magic links" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const body = (await request.json()) as {
      label?: string;
      accessMode?: string;
      expiresInDays?: number;
    };
    if (!isMagicLinkAccessMode(body.accessMode)) {
      return NextResponse.json(
        { error: "accessMode must be anyone or first_browser" },
        { status: 400 },
      );
    }
    if (
      !MAGIC_LINK_EXPIRY_DAYS.includes(
        body.expiresInDays as MagicLinkExpiryDays,
      )
    ) {
      return NextResponse.json(
        { error: "expiresInDays must be 1, 7, 14, or 30" },
        { status: 400 },
      );
    }

    const link = await createMagicLink({
      label: body.label,
      accessMode: body.accessMode,
      expiresInDays: body.expiresInDays as MagicLinkExpiryDays,
      createdBy: session.userId,
    });
    return NextResponse.json({ link });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create magic link";
    console.error("POST /api/admin/magic-links failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
