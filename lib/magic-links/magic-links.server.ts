import "server-only";

import { evaluateMagicLinkAccess } from "@/lib/magic-links/access";
import {
  clearMagicSessionCookie,
  getMagicSigningSecret,
  readMagicCookiePayload,
  writeMagicSessionCookie,
} from "@/lib/magic-links/cookie.server";
import {
  countFamilyStudents,
  createFamilyStudent,
} from "@/lib/family/family-students.server";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  createBrowserNonce,
  hashBrowserNonce,
  magicUserId,
} from "@/lib/magic-links/token";
import {
  MAGIC_LINK_EXPIRY_DAYS,
  type MagicLinkAccessMode,
  type MagicLinkExpiryDays,
  type MagicLinkRecord,
  type MagicLinkRedeemError,
  type MagicLinkSession,
} from "@/lib/magic-links/types";

type MagicLinkRow = {
  id: string;
  token: string;
  label: string;
  access_mode: MagicLinkAccessMode;
  expires_at: string;
  disabled_at: string | null;
  disabled_by: string | null;
  created_by: string;
  created_at: string;
  last_redeemed_at: string | null;
  redeem_count: number;
  claimed_at: string | null;
  claimed_browser_hash: string | null;
};

function mapRow(row: MagicLinkRow): MagicLinkRecord {
  return {
    id: row.id,
    token: row.token,
    label: row.label ?? "",
    accessMode: row.access_mode,
    expiresAt: row.expires_at,
    disabledAt: row.disabled_at,
    disabledBy: row.disabled_by,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastRedeemedAt: row.last_redeemed_at,
    redeemCount: row.redeem_count ?? 0,
    claimedAt: row.claimed_at,
    claimedBrowserHash: row.claimed_browser_hash,
  };
}

const SELECT_COLUMNS =
  "id, token, label, access_mode, expires_at, disabled_at, disabled_by, created_by, created_at, last_redeemed_at, redeem_count, claimed_at, claimed_browser_hash";

function isMissingTableError(message: string): boolean {
  return /magic_links/i.test(message) || /schema cache/i.test(message);
}

export async function listMagicLinks(): Promise<MagicLinkRecord[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("magic_links")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) {
      console.warn("magic_links unavailable:", error.message);
      return [];
    }
    throw new Error(`Failed to load magic links: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRow(row as MagicLinkRow));
}

export async function createMagicLink(input: {
  label?: string;
  accessMode: MagicLinkAccessMode;
  expiresInDays: MagicLinkExpiryDays;
  createdBy: string;
}): Promise<MagicLinkRecord> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  if (!MAGIC_LINK_EXPIRY_DAYS.includes(input.expiresInDays)) {
    throw new Error("Expiry must be 1, 7, 14, or 30 days.");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("magic_links")
    .insert({
      label: (input.label ?? "").trim().slice(0, 80),
      access_mode: input.accessMode,
      expires_at: expiresAt.toISOString(),
      created_by: input.createdBy,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create magic link: ${error?.message ?? "Unknown error"}`);
  }

  return mapRow(data as MagicLinkRow);
}

export async function disableMagicLink(
  id: string,
  disabledBy: string,
): Promise<MagicLinkRecord> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("magic_links")
    .update({
      disabled_at: new Date().toISOString(),
      disabled_by: disabledBy,
    })
    .eq("id", id)
    .is("disabled_at", null)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to disable magic link: ${error.message}`);
  }
  if (!data) {
    throw new Error("Magic link not found or already disabled.");
  }

  return mapRow(data as MagicLinkRow);
}

async function getMagicLinkByToken(token: string): Promise<MagicLinkRecord | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("magic_links")
    .select(SELECT_COLUMNS)
    .eq("token", token)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) return null;
    throw new Error(`Failed to load magic link: ${error.message}`);
  }
  return data ? mapRow(data as MagicLinkRow) : null;
}

async function getMagicLinkById(id: string): Promise<MagicLinkRecord | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("magic_links")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) return null;
    throw new Error(`Failed to load magic link: ${error.message}`);
  }
  return data ? mapRow(data as MagicLinkRow) : null;
}

async function ensureDemoStudent(link: MagicLinkRecord): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const userId = magicUserId(link.id);
  const existing = await countFamilyStudents(userId);
  if (existing > 0) return;
  const name = link.label.trim() || "Demo student";
  await createFamilyStudent(userId, { name, displayName: name });
}

function sessionFromLink(link: MagicLinkRecord): MagicLinkSession {
  return {
    userId: magicUserId(link.id),
    linkId: link.id,
    label: link.label.trim() || "Magic link guest",
    expiresAt: link.expiresAt,
  };
}

async function recordRedeem(
  link: MagicLinkRecord,
  claim?: { nonce: string },
): Promise<boolean> {
  const supabase = createSupabaseAdmin();
  const patch: Record<string, unknown> = {
    last_redeemed_at: new Date().toISOString(),
    redeem_count: link.redeemCount + 1,
  };
  if (claim) {
    patch.claimed_browser_hash = hashBrowserNonce(claim.nonce);
    patch.claimed_at = new Date().toISOString();
  }

  let query = supabase.from("magic_links").update(patch).eq("id", link.id);
  if (claim) {
    query = query.is("claimed_browser_hash", null);
  }

  const { data, error } = await query.select("id").maybeSingle();
  if (error) {
    throw new Error(`Failed to record redeem: ${error.message}`);
  }
  return Boolean(data);
}

export async function redeemMagicLink(
  token: string,
): Promise<{ ok: true } | { ok: false; reason: MagicLinkRedeemError }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, reason: "unavailable" };
  }
  if (!getMagicSigningSecret()) {
    return { ok: false, reason: "unavailable" };
  }

  const link = await getMagicLinkByToken(token);
  if (!link) return { ok: false, reason: "invalid" };

  const existing = await readMagicCookiePayload();
  const cookieNonce =
    existing?.id === link.id ? existing.n : null;
  const result = evaluateMagicLinkAccess(
    link,
    cookieNonce ? hashBrowserNonce(cookieNonce) : null,
  );
  if (!result.ok) return result;

  const nonce =
    result.action === "reuse" && cookieNonce
      ? cookieNonce
      : createBrowserNonce();

  if (result.action === "claim") {
    const claimed = await recordRedeem(link, { nonce });
    if (!claimed) {
      return { ok: false, reason: "claimed" };
    }
  } else {
    await recordRedeem(link);
  }

  await writeMagicSessionCookie({
    v: 1,
    id: link.id,
    n: nonce,
    exp: Math.floor(new Date(link.expiresAt).getTime() / 1000),
  });

  try {
    await ensureDemoStudent(link);
  } catch (error) {
    console.error("Failed to create demo student for magic link:", error);
  }

  return { ok: true };
}

export async function readMagicLinkSession(): Promise<MagicLinkSession | null> {
  const payload = await readMagicCookiePayload();
  if (!payload) return null;

  const link = await getMagicLinkById(payload.id);
  if (!link) {
    await clearMagicSessionCookie();
    return null;
  }

  const result = evaluateMagicLinkAccess(
    link,
    payload.n ? hashBrowserNonce(payload.n) : null,
  );
  if (!result.ok) {
    await clearMagicSessionCookie();
    return null;
  }

  return sessionFromLink(link);
}
