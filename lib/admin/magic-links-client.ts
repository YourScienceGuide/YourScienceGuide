import { magicLinkStatus } from "@/lib/magic-links/access";
import type { MagicLinkRecord, MagicLinkStatus } from "@/lib/magic-links/types";

export type AdminMagicLink = MagicLinkRecord & { status: MagicLinkStatus };

function withStatus(link: MagicLinkRecord): AdminMagicLink {
  return { ...link, status: magicLinkStatus(link) };
}

async function readError(res: Response): Promise<string> {
  const payload = (await res.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? "Request failed";
}

export async function fetchMagicLinksAdmin(): Promise<AdminMagicLink[]> {
  const res = await fetch("/api/admin/magic-links", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json()) as { links: MagicLinkRecord[] };
  return (data.links ?? []).map(withStatus);
}

export async function createMagicLinkAdmin(input: {
  label: string;
  accessMode: MagicLinkRecord["accessMode"];
  expiresInDays: 1 | 7 | 14 | 30;
}): Promise<AdminMagicLink> {
  const res = await fetch("/api/admin/magic-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json()) as { link: MagicLinkRecord };
  return withStatus(data.link);
}

export async function disableMagicLinkAdmin(id: string): Promise<AdminMagicLink> {
  const res = await fetch(`/api/admin/magic-links/${id}/disable`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json()) as { link: MagicLinkRecord };
  return withStatus(data.link);
}

export function magicLinkAbsoluteUrl(token: string, origin?: string): string {
  const base = (origin ?? "").replace(/\/$/, "");
  return `${base}/${token}`;
}
