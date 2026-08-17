export const MAGIC_LINK_ACCESS_MODES = ["anyone", "first_browser"] as const;

export type MagicLinkAccessMode = (typeof MAGIC_LINK_ACCESS_MODES)[number];

export const MAGIC_LINK_EXPIRY_DAYS = [1, 7, 14, 30] as const;

export type MagicLinkExpiryDays = (typeof MAGIC_LINK_EXPIRY_DAYS)[number];

export type MagicLinkRecord = {
  id: string;
  token: string;
  label: string;
  accessMode: MagicLinkAccessMode;
  expiresAt: string;
  disabledAt: string | null;
  disabledBy: string | null;
  createdBy: string;
  createdAt: string;
  lastRedeemedAt: string | null;
  redeemCount: number;
  claimedAt: string | null;
  claimedBrowserHash: string | null;
};

export type MagicLinkStatus = "active" | "expired" | "disabled";

export type MagicLinkSession = {
  userId: string;
  linkId: string;
  label: string;
  expiresAt: string;
};

export type MagicCookiePayload = {
  v: 1;
  id: string;
  n: string;
  exp: number;
};

export type MagicLinkRedeemError =
  | "invalid"
  | "disabled"
  | "expired"
  | "claimed"
  | "unavailable";
