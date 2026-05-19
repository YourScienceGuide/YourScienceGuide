"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function NotificationsSection() {
  const [lessonComplete, setLessonComplete] = useState(true);
  const [gradingRequired, setGradingRequired] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Notifications
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Choose when we email you about your student&apos;s activity.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900"
      >
        <Switch
          id="email-lesson-complete"
          label="Email on lesson completion"
          description="Get a summary when your student finishes a lesson."
          checked={lessonComplete}
          onCheckedChange={setLessonComplete}
        />
        <Switch
          id="email-grading-required"
          label="Email for manual grading required"
          description="Alert when a long-answer response is waiting for your review."
          checked={gradingRequired}
          onCheckedChange={setGradingRequired}
        />
        <div className="flex flex-wrap items-center gap-4 border-t border-sky-100 pt-6 dark:border-stone-800">
          <Button type="submit">Save preferences</Button>
          {saved && (
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Preferences saved.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
