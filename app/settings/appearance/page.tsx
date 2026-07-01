import type { Metadata } from "next";

import { DarkModeToggle } from "@/components/dark-mode-toggle";

export const metadata: Metadata = {
  title: "Settings · Appearance",
};

export default function SettingsAppearancePage() {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-stone-500">
        Appearance
      </h2>
      <div className="flex items-center justify-between gap-6 rounded-lg border border-sky-200 bg-white px-5 py-4 dark:border-stone-700 dark:bg-stone-900">
        <div>
          <p className="font-medium text-slate-900 dark:text-stone-50">Dark mode</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
            Switch to the stone palette for low-light reading.
          </p>
        </div>
        <DarkModeToggle />
      </div>
    </section>
  );
}
