"use client";

import Link from "next/link";
import { useState } from "react";

import { useActiveStudent } from "@/components/family/active-student-provider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { FamilyStudent, StudentPreferences } from "@/lib/family/types";
import { cn } from "@/lib/utils";

export function FamilyStudentsSection() {
  const { students, selectStudent, getPreferences, updatePreferences } =
    useActiveStudent();
  const [editingId, setEditingId] = useState(students[0]?.id ?? "");
  const editingStudent = students.find((s) => s.id === editingId);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Students on this account
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Manage each learner separately. Notification and dashboard preferences
          can differ per student.
        </p>
      </div>

      <ul className="space-y-3">
        {students.map((student) => (
          <StudentRow
            key={student.id}
            student={student}
            selected={editingId === student.id}
            onSelect={() => setEditingId(student.id)}
            onOpenAsStudent={() => selectStudent(student.id)}
          />
        ))}
      </ul>

      {editingStudent && (
        <StudentPreferencesForm
          key={editingStudent.id}
          student={editingStudent}
          getPreferences={getPreferences}
          updatePreferences={updatePreferences}
        />
      )}

      <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50/30 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-800/30 dark:text-stone-400">
        Adding or removing students will connect to your subscription in a future
        release. This preview shows three mock learners on one parent account.
      </div>
    </div>
  );
}

function StudentRow({
  student,
  selected,
  onSelect,
  onOpenAsStudent,
}: {
  student: FamilyStudent;
  selected: boolean;
  onSelect: () => void;
  onOpenAsStudent: () => void;
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
        selected
          ? "border-sky-400 bg-sky-50/50 dark:border-stone-500 dark:bg-stone-800/50"
          : "border-sky-200 bg-white dark:border-stone-700 dark:bg-stone-900",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800 dark:bg-stone-800 dark:text-stone-100"
          aria-hidden
        >
          {student.avatarInitials}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-stone-50">
            {student.name}
          </p>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            {student.courseName} · {student.courseProgress}% complete
          </p>
        </div>
      </button>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onSelect}>
          {selected ? "Editing preferences" : "Edit preferences"}
        </Button>
        <Button type="button" size="sm" asChild>
          <Link href="/student" onClick={onOpenAsStudent}>
            Open student view
          </Link>
        </Button>
      </div>
    </li>
  );
}

function StudentPreferencesForm({
  student,
  getPreferences,
  updatePreferences,
}: {
  student: FamilyStudent;
  getPreferences: (id: string) => StudentPreferences;
  updatePreferences: (id: string, prefs: StudentPreferences) => void;
}) {
  const [prefs, setPrefs] = useState(() => getPreferences(student.id));
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updatePreferences(student.id, prefs);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
          Preferences for {student.displayName}
        </h3>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          These settings apply only to this student&apos;s activity and reports.
        </p>
      </div>

      <Switch
        id={`${student.id}-lesson-complete`}
        label="Email on lesson completion"
        description="Notify you when this student finishes a lesson."
        checked={prefs.emailOnLessonComplete}
        onCheckedChange={(emailOnLessonComplete) =>
          setPrefs((p) => ({ ...p, emailOnLessonComplete }))
        }
      />
      <Switch
        id={`${student.id}-grading`}
        label="Email for manual grading required"
        description="Alert when this student's long-answer work needs review."
        checked={prefs.emailOnGradingRequired}
        onCheckedChange={(emailOnGradingRequired) =>
          setPrefs((p) => ({ ...p, emailOnGradingRequired }))
        }
      />
      <Switch
        id={`${student.id}-grade-dashboard`}
        label="Show grade on parent dashboard"
        description="Include letter grade in the progress summary for this student."
        checked={prefs.showGradeOnDashboard}
        onCheckedChange={(showGradeOnDashboard) =>
          setPrefs((p) => ({ ...p, showGradeOnDashboard }))
        }
      />

      <div className="flex flex-wrap items-center gap-4 border-t border-sky-100 pt-6 dark:border-stone-800">
        <Button type="submit">Save preferences</Button>
        {saved && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Preferences saved for {student.displayName}.
          </p>
        )}
      </div>
    </form>
  );
}
