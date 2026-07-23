import { NextResponse } from "next/server";

import { joinWaitlist } from "@/lib/waitlist/waitlist.server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      source?: string;
      website?: string; // honeypot
    };

    // Bots often fill hidden fields; reject quietly.
    if (body.website?.trim()) {
      return NextResponse.json({ ok: true, alreadyJoined: false });
    }

    const result = await joinWaitlist({
      email: body.email ?? "",
      name: body.name,
      source: body.source,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      alreadyJoined: result.alreadyJoined,
    });
  } catch (error) {
    console.error("POST /api/waitlist failed:", error);
    return NextResponse.json(
      { error: "Could not join the waitlist. Please try again." },
      { status: 500 },
    );
  }
}
