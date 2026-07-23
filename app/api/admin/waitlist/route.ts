import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { listWaitlistSignups } from "@/lib/waitlist/waitlist.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const signups = await listWaitlistSignups();
    return NextResponse.json({ signups });
  } catch (error) {
    console.error("GET /api/admin/waitlist failed:", error);
    return NextResponse.json(
      { error: "Failed to load waitlist" },
      { status: 500 },
    );
  }
}
