"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdminFeedback } from "@/components/admin/admin-action-feedback";
import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchWaitlistAdmin } from "@/lib/admin/waitlist-client";
import { formatSaveError } from "@/lib/admin/format-save-error";
import type { WaitlistSignup } from "@/lib/waitlist/waitlist";

function formatJoinedAt(iso: string): string {
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

export function AdminWaitlistPanel() {
  const [loading, setLoading] = useState(true);
  const [signups, setSignups] = useState<WaitlistSignup[]>([]);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);

  const loadSignups = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const next = await fetchWaitlistAdmin();
      setSignups(next);
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
    void loadSignups();
  }, [loadSignups]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return signups;
    return signups.filter(
      (row) =>
        row.email.toLowerCase().includes(q) ||
        (row.name?.toLowerCase().includes(q) ?? false) ||
        row.source.toLowerCase().includes(q),
    );
  }, [query, signups]);

  function copyEmails() {
    const emails = filtered.map((row) => row.email).join("\n");
    void navigator.clipboard.writeText(emails).then(
      () => {
        setFeedback({
          type: "success",
          message: `Copied ${filtered.length} email${filtered.length === 1 ? "" : "s"} to the clipboard.`,
        });
      },
      () => {
        setFeedback({
          type: "error",
          message: "Could not copy emails to the clipboard.",
        });
      },
    );
  }

  return (
    <div className="space-y-6">
      <AdminActionFeedback
        feedback={feedback}
        onDismiss={() => setFeedback(null)}
      />

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Waitlist signups
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          People who joined from the parent billing page while registration is
          closed. Newest first.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block min-w-[16rem] flex-1 text-sm">
          <span className="text-slate-600 dark:text-stone-400">Search</span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Email, name, or source"
            className="mt-1"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || filtered.length === 0}
            onClick={copyEmails}
          >
            Copy emails
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void loadSignups()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Loading waitlist…
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
          {signups.length === 0
            ? "No waitlist signups yet."
            : "No signups match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-sky-200 dark:border-stone-700">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-sky-200 bg-sky-50/80 text-xs uppercase tracking-wide text-slate-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-400">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 bg-white dark:divide-stone-800 dark:bg-stone-900">
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-slate-900 dark:text-stone-50">
                    <a
                      href={`mailto:${row.email}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {row.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-stone-300">
                    {row.name || "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-stone-400">
                    {row.source}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-stone-400">
                    {formatJoinedAt(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && signups.length > 0 ? (
        <p className="text-xs text-slate-500 dark:text-stone-500">
          Showing {filtered.length} of {signups.length} signup
          {signups.length === 1 ? "" : "s"}.
        </p>
      ) : null}
    </div>
  );
}
