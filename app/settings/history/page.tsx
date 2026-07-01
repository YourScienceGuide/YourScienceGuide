import type { Metadata } from "next";

import { QuestionHistorySection } from "@/components/student/question-history-section";

export const metadata: Metadata = {
  title: "Settings · Question history",
};

export default function SettingsHistoryPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-stone-500">
        Learning
      </h2>
      <QuestionHistorySection
        title="All question history"
        description="Every assignment and extra practice attempt across all courses."
      />
    </section>
  );
}
