"use client";

import { Button } from "@/components/ui/button";
import { MOCK_BILLING } from "@/lib/parent/mock-data";

export function BillingSection() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Subscription &amp; billing
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Your family plan and payment details.
        </p>
      </div>

      <div className="rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
                Current level
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-stone-50">
                {MOCK_BILLING.plan}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
                Renews on
              </p>
              <p className="mt-1 text-base text-slate-700 dark:text-stone-300">
                {MOCK_BILLING.expiresOn}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            {MOCK_BILLING.status}
          </span>
        </div>
        <div className="mt-8 border-t border-sky-100 pt-6 dark:border-stone-800">
          <Button type="button">Manage payment method</Button>
        </div>
      </div>
    </div>
  );
}
