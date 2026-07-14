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
      <div className="space-y-4 rounded-lg border border-red-200 bg-red-50/60 px-5 py-5 dark:border-red-900 dark:bg-red-950/30">
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-900 dark:text-stone-50">
            Sign out
          </p>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            End your session and return to the home page on this device. You can
            also sign out from the Settings menu in the top navigation.
          </p>
        </div>
        <SignOutButton className="w-full sm:w-auto" />
      </div>
    </section>
  );
}
