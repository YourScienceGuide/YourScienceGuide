"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdminFeedback } from "@/components/admin/admin-action-feedback";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { Input } from "@/components/ui/input";
import {
  fetchPricingAdmin,
  savePricingAdmin,
} from "@/lib/admin/pricing-client";
import {
  ADMIN_SAVE_PUBLISHED_MESSAGE,
  successSaveFeedback,
} from "@/lib/admin/admin-save-feedback";
import { formatSaveError } from "@/lib/admin/format-save-error";
import {
  centsToDollarInput,
  DEFAULT_BILLING_PLANS,
  formatAmountCents,
  parseDollarInputToCents,
  type BillingPlanRecord,
} from "@/lib/billing/pricing";

type PricingDraft = {
  id: BillingPlanRecord["id"];
  label: string;
  description: string;
  badge: string;
  amountInput: string;
  stripePriceId: string | null;
};

function toDraft(plans: BillingPlanRecord[]): PricingDraft[] {
  return plans.map((plan) => ({
    id: plan.id,
    label: plan.label,
    description: plan.description,
    badge: plan.badge ?? "",
    amountInput: centsToDollarInput(plan.amountCents),
    stripePriceId: plan.stripePriceId,
  }));
}

function draftKey(drafts: PricingDraft[]) {
  return JSON.stringify(
    drafts.map((plan) => ({
      id: plan.id,
      label: plan.label,
      description: plan.description,
      badge: plan.badge,
      amountInput: plan.amountInput,
    })),
  );
}

export function AdminPricingPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<PricingDraft[]>(
    toDraft(DEFAULT_BILLING_PLANS),
  );
  const [draft, setDraft] = useState<PricingDraft[]>(
    toDraft(DEFAULT_BILLING_PLANS),
  );
  const [saveFeedback, setSaveFeedback] = useState<AdminFeedback | null>(null);

  const isDirty = useMemo(
    () => draftKey(draft) !== draftKey(saved),
    [draft, saved],
  );

  const loadContent = useCallback(async () => {
    setLoading(true);
    setSaveFeedback(null);
    try {
      const plans = await fetchPricingAdmin();
      const next = toDraft(plans);
      setSaved(next);
      setDraft(next);
    } catch (error) {
      const formatted = formatSaveError(error);
      setSaveFeedback({
        type: "error",
        message: formatted.message,
        tips: formatted.tips,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  function updatePlan(id: PricingDraft["id"], patch: Partial<PricingDraft>) {
    setSaveFeedback(null);
    setDraft((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, ...patch } : plan)),
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaveFeedback(null);
    try {
      const payload = draft.map((plan) => {
        const amountCents = parseDollarInputToCents(plan.amountInput);
        if (amountCents == null) {
          throw new Error(
            `Enter a valid dollar amount for the ${plan.label || plan.id} plan.`,
          );
        }
        return {
          id: plan.id,
          label: plan.label,
          description: plan.description,
          badge: plan.badge.trim() || null,
          amountCents,
        };
      });

      const plans = await savePricingAdmin(payload);
      const next = toDraft(plans);
      setSaved(next);
      setDraft(next);
      setSaveFeedback(
        successSaveFeedback(
          `${ADMIN_SAVE_PUBLISHED_MESSAGE} Stripe prices were updated to match.`,
        ),
      );
    } catch (error) {
      const formatted = formatSaveError(error);
      setSaveFeedback({
        type: "error",
        message: formatted.message,
        tips: formatted.tips,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setDraft(saved);
    setSaveFeedback(null);
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading pricing…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Subscription pricing
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Edit plan amounts shown on the parent billing page. Saving creates or
          updates Stripe Prices so checkout charges the same amounts.
        </p>
      </div>

      <div className="space-y-6">
        {draft.map((plan) => {
          const previewCents = parseDollarInputToCents(plan.amountInput);
          return (
            <div
              key={plan.id}
              className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium uppercase tracking-wide text-sky-700 dark:text-stone-400">
                  {plan.id} plan
                </p>
                {previewCents != null && (
                  <p className="text-sm text-slate-500 dark:text-stone-500">
                    Preview: {formatAmountCents(previewCents)}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Label">
                  <Input
                    value={plan.label}
                    onChange={(e) =>
                      updatePlan(plan.id, { label: e.target.value })
                    }
                    disabled={saving}
                  />
                </Field>
                <Field label="Price (USD)">
                  <Input
                    inputMode="decimal"
                    value={plan.amountInput}
                    onChange={(e) =>
                      updatePlan(plan.id, { amountInput: e.target.value })
                    }
                    placeholder="19.99"
                    disabled={saving}
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={plan.description}
                  onChange={(e) =>
                    updatePlan(plan.id, { description: e.target.value })
                  }
                  rows={3}
                  disabled={saving}
                  className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-200 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50 dark:focus-visible:border-stone-400 dark:focus-visible:ring-stone-700"
                />
              </Field>

              {plan.id === "annual" && (
                <Field label="Badge (optional)">
                  <Input
                    value={plan.badge}
                    onChange={(e) =>
                      updatePlan(plan.id, { badge: e.target.value })
                    }
                    placeholder="Best value"
                    disabled={saving}
                  />
                </Field>
              )}

              {plan.stripePriceId && (
                <p className="text-xs text-slate-500 dark:text-stone-500">
                  Stripe price:{" "}
                  <code className="text-xs">{plan.stripePriceId}</code>
                </p>
              )}
            </div>
          );
        })}
      </div>

      <AdminSaveBar
        isDirty={isDirty}
        saving={saving}
        feedback={saveFeedback}
        onSave={() => void handleSave()}
        onDiscard={handleDiscard}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700 dark:text-stone-300">
        {label}
      </label>
      {children}
    </div>
  );
}
