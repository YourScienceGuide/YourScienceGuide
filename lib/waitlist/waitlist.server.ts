import "server-only";

import {
  isValidWaitlistEmail,
  normalizeWaitlistEmail,
  normalizeWaitlistName,
  type WaitlistSignup,
} from "@/lib/waitlist/waitlist";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export type { WaitlistSignup };

type WaitlistSignupRow = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  created_at: string;
};

function mapRow(row: WaitlistSignupRow): WaitlistSignup {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    source: row.source,
    createdAt: row.created_at,
  };
}

export async function listWaitlistSignups(): Promise<WaitlistSignup[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("waitlist_signups")
    .select("id, email, name, source, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    if (/waitlist_signups/i.test(error.message) || /schema cache/i.test(error.message)) {
      console.warn("waitlist_signups unavailable:", error.message);
      return [];
    }
    throw new Error(`Failed to load waitlist: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRow(row as WaitlistSignupRow));
}

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
