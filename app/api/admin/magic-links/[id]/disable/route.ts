import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { disableMagicLink } from "@/lib/magic-links/magic-links.server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing link id" }, { status: 400 });
  }

  try {
    const link = await disableMagicLink(id, session.userId);
    return NextResponse.json({ link });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to disable magic link";
    console.error("POST /api/admin/magic-links/[id]/disable failed:", error);
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
