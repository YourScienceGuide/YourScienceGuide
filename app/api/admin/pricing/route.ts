import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import type { BillingPlanSaveInput } from "@/lib/billing/pricing.server";
import {
  loadBillingPlans,
  saveBillingPlans,
} from "@/lib/billing/pricing.server";
import type { SubscriptionPlan } from "@/lib/billing/subscription";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const plans = await loadBillingPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("GET /api/admin/pricing failed:", error);
    return NextResponse.json(
      { error: "Failed to load pricing" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Saving is not available right now." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      plans?: Array<{
        id?: string;
        label?: string;
        description?: string;
        badge?: string | null;
        amountCents?: number;
      }>;
    };

    if (!Array.isArray(body.plans) || body.plans.length === 0) {
      return NextResponse.json(
        { error: "plans must be a non-empty array" },
        { status: 400 },
      );
    }

    const inputs: BillingPlanSaveInput[] = body.plans.map((plan) => {
      if (plan.id !== "monthly" && plan.id !== "annual") {
        throw new Error("Each plan must have id monthly or annual.");
      }
      return {
        id: plan.id as SubscriptionPlan,
        label: plan.label ?? "",
        description: plan.description ?? "",
        badge: plan.badge ?? null,
        amountCents: plan.amountCents ?? 0,
      };
    });

    const plans = await saveBillingPlans(inputs);
    return NextResponse.json({ plans });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save pricing";
    console.error("PUT /api/admin/pricing failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
