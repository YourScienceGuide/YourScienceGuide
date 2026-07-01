import type { Metadata } from "next";

import { SignOutButton } from "@/components/settings/sign-out-button";

export const metadata: Metadata = {
  title: "Settings · Account",
};

export default function SettingsAccountPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-stone-500">
        Account
      </h2>
      <div className="flex items-center justify-between gap-6 rounded-lg border border-sky-200 bg-white px-5 py-4 dark:border-stone-700 dark:bg-stone-900">
        <div>
          <p className="font-medium text-slate-900 dark:text-stone-50">Sign out</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
            Return to the sign-in screen on this device.
          </p>
        </div>
        <SignOutButton />
      </div>
    </section>
  );
}
