import type {
  MagicLinkAccessMode,
  MagicLinkRedeemError,
  MagicLinkRecord,
  MagicLinkStatus,
} from "@/lib/magic-links/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isMagicLinkToken(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function magicLinkStatus(
  link: Pick<MagicLinkRecord, "disabledAt" | "expiresAt">,
  nowMs = Date.now(),
): MagicLinkStatus {
  if (link.disabledAt) return "disabled";
  if (new Date(link.expiresAt).getTime() <= nowMs) return "expired";
  return "active";
}

export function isMagicLinkAccessMode(value: unknown): value is MagicLinkAccessMode {
  return value === "anyone" || value === "first_browser";
}

export type MagicLinkEvaluateResult =
  | { ok: true; action: "open" | "claim" | "reuse" }
  | { ok: false; reason: MagicLinkRedeemError };

export function evaluateMagicLinkAccess(
  link: Pick<
    MagicLinkRecord,
    "disabledAt" | "expiresAt" | "accessMode" | "claimedBrowserHash"
  >,
  cookieNonceHash: string | null,
  nowMs = Date.now(),
): MagicLinkEvaluateResult {
  const status = magicLinkStatus(link, nowMs);
  if (status === "disabled") return { ok: false, reason: "disabled" };
  if (status === "expired") return { ok: false, reason: "expired" };

  if (link.accessMode !== "first_browser") {
    return { ok: true, action: "open" };
  }

  if (!link.claimedBrowserHash) {
    return { ok: true, action: "claim" };
  }

  if (cookieNonceHash && cookieNonceHash === link.claimedBrowserHash) {
    return { ok: true, action: "reuse" };
  }

  return { ok: false, reason: "claimed" };
}
