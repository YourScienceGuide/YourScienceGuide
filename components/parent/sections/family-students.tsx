"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminConfirmDeleteDialog } from "@/components/admin/admin-confirm-delete-dialog";
import { useActiveStudent } from "@/components/family/active-student-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MAX_FAMILY_STUDENTS } from "@/lib/family/family-students.constants";
import type { FamilyStudent, StudentPreferences } from "@/lib/family/types";
import { cn } from "@/lib/utils";

export function FamilyStudentsSection() {
  const {
    students,
    studentsSource,
    maxStudents,
    selectStudent,
    getPreferences,
    updatePreferences,
    addStudent,
    removeStudent,
  } = useActiveStudent();
  const [editingId, setEditingId] = useState(students[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FamilyStudent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const editingStudent = students.find((s) => s.id === editingId);
  const atStudentLimit = students.length >= maxStudents;

  useEffect(() => {
    if (students.length === 0) {
      setEditingId("");
      return;
    }
    if (!students.some((s) => s.id === editingId)) {
      setEditingId(students[0].id);
    }
  }, [editingId, students]);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      const student = await addStudent(
        newName,
        newDisplayName.trim() || undefined,
      );
      setNewName("");
      setNewDisplayName("");
      setEditingId(student.id);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : "Could not add student");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteStudent() {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await removeStudent(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteConfirm("");
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Could not remove student",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Students on this account
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Add each learner on your family plan. Notification and dashboard
          preferences can differ per student.
        </p>
      </div>

      {studentsSource === "unavailable" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Student profiles require Supabase to be configured for this site.
        </div>
      )}

      {students.length === 0 ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400">
          No students yet. Add your first learner below to open the student area.
        </p>
      ) : (
        <ul className="space-y-3">
          {students.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              selected={editingId === student.id}
              onSelect={() => setEditingId(student.id)}
              onOpenAsStudent={() => selectStudent(student.id)}
              onRemove={() => {
                setDeleteError(null);
                setDeleteConfirm("");
                setDeleteTarget(student);
              }}
            />
          ))}
        </ul>
      )}

      {editingStudent && (
        <StudentPreferencesForm
          key={editingStudent.id}
          student={editingStudent}
          getPreferences={getPreferences}
          updatePreferences={updatePreferences}
        />
      )}

      <form
        onSubmit={handleAddStudent}
        className="space-y-4 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900"
      >
        <div className="space-y-1">
          <h3 className="text-sm font-medium uppercase tracking-wide text-sky-600 dark:text-stone-400">
            Add a student
          </h3>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            Up to {maxStudents} students per account ({students.length} of{" "}
            {maxStudents} used).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="new-student-name"
              className="text-sm font-medium text-slate-900 dark:text-stone-50"
            >
              Full name
            </label>
            <Input
              id="new-student-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Alex Rivera"
              required
              disabled={atStudentLimit || studentsSource === "unavailable"}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="new-student-display-name"
              className="text-sm font-medium text-slate-900 dark:text-stone-50"
            >
              Display name (optional)
            </label>
            <Input
              id="new-student-display-name"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="Alex"
              disabled={atStudentLimit || studentsSource === "unavailable"}
            />
          </div>
        </div>

        {addError && (
          <p className="text-sm text-amber-700 dark:text-amber-300">{addError}</p>
        )}

        <Button
          type="submit"
          disabled={
            adding ||
            atStudentLimit ||
            studentsSource === "unavailable" ||
            !newName.trim()
          }
        >
          {adding ? "Adding…" : "Add student"}
        </Button>

        {atStudentLimit && (
          <p className="text-sm text-slate-600 dark:text-stone-400">
            You have reached the limit of {MAX_FAMILY_STUDENTS} students on your
            account.
          </p>
        )}
      </form>

      <AdminConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteConfirm("");
            setDeleteError(null);
          }
        }}
        title="Remove student?"
        description={
          <>
            <p>
              This removes <strong>{deleteTarget?.name}</strong> from your account.
              Their question history for this site will also be deleted.
            </p>
            {deleteError && (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                {deleteError}
              </p>
            )}
          </>
        }
        confirmPhrase={deleteTarget?.displayName ?? "remove"}
        confirmText={deleteConfirm}
        onConfirmTextChange={setDeleteConfirm}
        onConfirm={handleDeleteStudent}
        saving={deleting}
        confirmLabel="Remove student"
      />
    </div>
  );
}

function StudentRow({
  student,
  selected,
  onSelect,
  onOpenAsStudent,
  onRemove,
}: {
  student: FamilyStudent;
  selected: boolean;
  onSelect: () => void;
  onOpenAsStudent: () => void;
  onRemove: () => void;
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
            {student.courseName}
            {student.courseProgress > 0
              ? ` · ${student.courseProgress}% complete`
              : ""}
          </p>
        </div>
      </button>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onSelect}>
          {selected ? "Editing preferences" : "Edit preferences"}
        </Button>
        <Button type="button" size="sm" asChild>
          <Link href="/student" onClick={onOpenAsStudent}>
            Open student view
          </Link>
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onRemove}>
          Remove
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
  updatePreferences: (id: string, prefs: StudentPreferences) => Promise<void>;
}) {
  const [prefs, setPrefs] = useState(() => getPreferences(student.id));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(getPreferences(student.id));
    setSaved(false);
    setError(null);
  }, [getPreferences, student.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updatePreferences(student.id, prefs);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preferences");
    } finally {
      setSaving(false);
    }
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
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save preferences"}
        </Button>
        {saved && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Preferences saved for {student.displayName}.
          </p>
        )}
        {error && (
          <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
        )}
      </div>
    </form>
  );
}
