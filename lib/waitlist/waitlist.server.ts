import "server-only";

import {
  isValidWaitlistEmail,
  normalizeWaitlistEmail,
  normalizeWaitlistName,
} from "@/lib/waitlist/waitlist";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export type WaitlistJoinInput = {
  email: string;
  name?: string | null;
  source?: string;
};

export type WaitlistJoinResult =
  | { ok: true; alreadyJoined: boolean }
  | { ok: false; error: string; status: number };

export async function joinWaitlist(
  input: WaitlistJoinInput,
): Promise<WaitlistJoinResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Waitlist signup is not available right now.",
      status: 503,
    };
  }

  const email = normalizeWaitlistEmail(input.email);
  if (!isValidWaitlistEmail(email)) {
    return { ok: false, error: "Enter a valid email address.", status: 400 };
  }

  const name = normalizeWaitlistName(input.name);
  const source = (input.source?.trim() || "parent-billing").slice(0, 64);

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("waitlist_signups").insert({
    email,
    name,
    source,
  });

  if (error) {
    // Unique violation → already on the list (treat as success).
    if (error.code === "23505") {
      return { ok: true, alreadyJoined: true };
    }
    console.error("joinWaitlist failed:", error.message);
    return {
      ok: false,
      error: "Could not join the waitlist. Please try again.",
      status: 500,
    };
  }

  return { ok: true, alreadyJoined: false };
}
