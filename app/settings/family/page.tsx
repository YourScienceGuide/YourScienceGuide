import type { Metadata } from "next";

import { SwitchStudentButton } from "@/components/student/switch-student-button";

export const metadata: Metadata = {
  title: "Settings · Family",
};

export default function SettingsFamilyPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-stone-500">
        Family
      </h2>
      <div className="flex items-center justify-between gap-6 rounded-lg border border-sky-200 bg-white px-5 py-4 dark:border-stone-700 dark:bg-stone-900">
        <div>
          <p className="font-medium text-slate-900 dark:text-stone-50">
            Switch student
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
            Choose a different learner before opening courses.
          </p>
        </div>
        <SwitchStudentButton variant="outline" />
      </div>
    </section>
  );
}
