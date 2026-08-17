import { notFound, redirect } from "next/navigation";

import { isMagicLinkToken } from "@/lib/magic-links/access";
import { redeemMagicLink } from "@/lib/magic-links/magic-links.server";
import type { MagicLinkRedeemError } from "@/lib/magic-links/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

const ERROR_COPY: Record<MagicLinkRedeemError, { title: string; body: string }> = {
  invalid: {
    title: "Link not found",
    body: "This access link is not valid. Ask an admin for a new one.",
  },
  disabled: {
    title: "Link disabled",
    body: "An admin turned off this access link. It can no longer be used.",
  },
  expired: {
    title: "Link expired",
    body: "This access link has expired. Ask an admin to create a new one.",
  },
  claimed: {
    title: "Link already in use",
    body: "This link is bound to another browser and cannot be used here.",
  },
  unavailable: {
    title: "Access unavailable",
    body: "Magic-link access is not available right now. Please try again later.",
  },
};

export default async function MagicLinkPage({ params }: PageProps) {
  const { token } = await params;
  if (!isMagicLinkToken(token)) {
    notFound();
  }

  const result = await redeemMagicLink(token);
  if (result.ok) {
    redirect("/student");
  }

  const copy = ERROR_COPY[result.reason];
  return (
    <div className="mx-auto max-w-lg space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
        {copy.title}
      </h1>
      <p className="text-base text-slate-600 dark:text-stone-400">{copy.body}</p>
    </div>
  );
}
