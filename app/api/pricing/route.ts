import { NextResponse } from "next/server";

import { loadBillingPlanDisplays } from "@/lib/billing/pricing.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await loadBillingPlanDisplays();
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("GET /api/pricing failed:", error);
    return NextResponse.json(
      { error: "Failed to load pricing" },
      { status: 500 },
    );
  }
}
