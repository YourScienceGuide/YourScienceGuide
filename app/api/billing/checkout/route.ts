import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { requireAuthenticated } from "@/lib/auth/require-authenticated";
import { createCheckoutSession } from "@/lib/billing/pricing.server";
import type { SubscriptionPlan } from "@/lib/billing/subscription";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireAuthenticated();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const body = (await request.json()) as { plan?: string };
    if (body.plan !== "monthly" && body.plan !== "annual") {
      return NextResponse.json(
        { error: "plan must be monthly or annual" },
        { status: 400 },
      );
    }

    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses[0]?.emailAddress ??
      null;

    const checkout = await createCheckoutSession({
      planId: body.plan as SubscriptionPlan,
      userId: session.userId,
      customerEmail: email,
    });

    return NextResponse.json(checkout);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start checkout";
    console.error("POST /api/billing/checkout failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
