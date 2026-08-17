"use client";

import { useCallback, useEffect, useState } from "react";

import type { AdminFeedback } from "@/components/admin/admin-action-feedback";
import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSaveError } from "@/lib/admin/format-save-error";
import {
  createMagicLinkAdmin,
  disableMagicLinkAdmin,
  fetchMagicLinksAdmin,
  magicLinkAbsoluteUrl,
  type AdminMagicLink,
} from "@/lib/admin/magic-links-client";
import {
  MAGIC_LINK_EXPIRY_DAYS,
  type MagicLinkAccessMode,
  type MagicLinkExpiryDays,
} from "@/lib/magic-links/types";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(status: AdminMagicLink["status"]): string {
  if (status === "active") return "Active";
  if (status === "expired") return "Expired";
  return "Disabled";
}

function accessLabel(mode: MagicLinkAccessMode): string {
  return mode === "first_browser" ? "First browser" : "Anyone with link";
}

export function AdminMagicLinksPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [links, setLinks] = useState<AdminMagicLink[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [label, setLabel] = useState("");
  const [accessMode, setAccessMode] = useState<MagicLinkAccessMode>("anyone");
  const [expiresInDays, setExpiresInDays] =
    useState<MagicLinkExpiryDays>(7);
  const [disablingId, setDisablingId] = useState<string | null>(null);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      setLinks(await fetchMagicLinksAdmin());
    } catch (error) {
      const formatted = formatSaveError(error);
      setFeedback({
        type: "error",
        message: formatted.message,
        tips: formatted.tips,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  async function handleCreate() {
    setSaving(true);
    setFeedback(null);
    try {
      const link = await createMagicLinkAdmin({
        label,
        accessMode,
        expiresInDays,
      });
      setLinks((current) => [link, ...current]);
      setLabel("");
      const url = magicLinkAbsoluteUrl(link.token, window.location.origin);
      await navigator.clipboard.writeText(url).catch(() => undefined);
      setFeedback({
        type: "success",
        message: `Created link and copied ${url}`,
      });
    } catch (error) {
      const formatted = formatSaveError(error);
      setFeedback({
        type: "error",
        message: formatted.message,
        tips: formatted.tips,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy(link: AdminMagicLink) {
    const url = magicLinkAbsoluteUrl(link.token, window.location.origin);
    try {
      await navigator.clipboard.writeText(url);
      setFeedback({ type: "success", message: `Copied ${url}` });
    } catch {
      setFeedback({ type: "error", message: "Could not copy the link." });
    }
  }

  async function handleDisable(link: AdminMagicLink) {
    setDisablingId(link.id);
    setFeedback(null);
    try {
      const next = await disableMagicLinkAdmin(link.id);
      setLinks((current) =>
        current.map((item) => (item.id === next.id ? next : item)),
      );
      setFeedback({ type: "success", message: "Link disabled." });
    } catch (error) {
      const formatted = formatSaveError(error);
      setFeedback({
        type: "error",
        message: formatted.message,
        tips: formatted.tips,
      });
    } finally {
      setDisablingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminActionFeedback
        feedback={feedback}
        onDismiss={() => setFeedback(null)}
      />

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Magic links
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Create a URL that signs someone in as a student (not admin) without an
          account. Disable a link at any time to cut off access immediately.
        </p>
      </div>

      <form
        className="space-y-4 rounded-lg border border-sky-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900"
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm sm:col-span-1">
            <span className="text-slate-600 dark:text-stone-400">Label</span>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Classroom preview"
              className="mt-1"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600 dark:text-stone-400">Who can use it</span>
            <select
              value={accessMode}
              onChange={(e) =>
                setAccessMode(e.target.value as MagicLinkAccessMode)
              }
              className="mt-1 flex h-10 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
            >
              <option value="anyone">Anyone with the link</option>
              <option value="first_browser">First browser only</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-600 dark:text-stone-400">Expires in</span>
            <select
              value={expiresInDays}
              onChange={(e) =>
                setExpiresInDays(Number(e.target.value) as MagicLinkExpiryDays)
              }
              className="mt-1 flex h-10 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
            >
              {MAGIC_LINK_EXPIRY_DAYS.map((days) => (
                <option key={days} value={days}>
                  {days} day{days === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create magic link"}
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Loading magic links…
        </p>
      ) : links.length === 0 ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
          No magic links yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-sky-200 dark:border-stone-700">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-sky-200 bg-sky-50/80 text-xs uppercase tracking-wide text-slate-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-400">
              <tr>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Uses</th>
                <th className="px-4 py-3 font-medium">Last used</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 bg-white dark:divide-stone-800 dark:bg-stone-900">
              {links.map((link) => (
                <tr key={link.id}>
                  <td className="px-4 py-3 text-slate-900 dark:text-stone-50">
                    <div>{link.label || "Untitled"}</div>
                    {link.claimedAt ? (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Claimed {formatWhen(link.claimedAt)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-stone-300">
                    {accessLabel(link.accessMode)}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-stone-300">
                    {statusLabel(link.status)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-stone-400">
                    {formatWhen(link.expiresAt)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-stone-400">
                    {link.redeemCount}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-stone-400">
                    {formatWhen(link.lastRedeemedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleCopy(link)}
                      >
                        Copy URL
                      </Button>
                      {link.status === "active" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={disablingId === link.id}
                          onClick={() => void handleDisable(link)}
                        >
                          {disablingId === link.id ? "Disabling…" : "Disable"}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
