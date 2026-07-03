"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";

import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CurriculumLesson } from "@/lib/student/curriculum-types";
import {
  duplicateLessonChapterSectionMessage,
  findLessonWithChapterSection,
  lessonChapterNumber,
  lessonSectionNumber,
} from "@/lib/student/lesson-sort";
import { cn } from "@/lib/utils";

type AdminLessonPositionEditorProps = {
  lesson: CurriculumLesson;
  courseLessons: CurriculumLesson[];
  saving: boolean;
  onSave: (
    lessonId: string,
    position: { chapter: number; section: number },
  ) => Promise<boolean>;
};

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

type NumberStepperProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  min?: number;
  disabled?: boolean;
};

function NumberStepper({
  id,
  label,
  value,
  onChange,
  onEnter,
  min = 1,
  disabled = false,
}: NumberStepperProps) {
  function step(delta: number) {
    const next = Math.max(min, parsePositiveInt(value, min) + delta);
    onChange(String(next));
  }

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-600 dark:text-stone-400">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="size-8 shrink-0 px-0"
          disabled={disabled || parsePositiveInt(value, min) <= min}
          onClick={() => step(-1)}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus className="size-3.5" aria-hidden />
        </Button>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter?.();
            }
          }}
          className="h-8 w-16 px-2 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="size-8 shrink-0 px-0"
          disabled={disabled}
          onClick={() => step(1)}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export function AdminLessonPositionEditor({
  lesson,
  courseLessons,
  saving,
  onSave,
}: AdminLessonPositionEditorProps) {
  const savedChapter = lessonChapterNumber(lesson) || 1;
  const savedSection = lessonSectionNumber(lesson) || 1;

  const [chapter, setChapter] = useState(String(savedChapter));
  const [section, setSection] = useState(String(savedSection));
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    setChapter(String(savedChapter));
    setSection(String(savedSection));
    setFeedback(null);
    setIsApplying(false);
  }, [lesson.id, savedChapter, savedSection]);

  const draftChapter = parsePositiveInt(chapter, savedChapter);
  const draftSection = parsePositiveInt(section, savedSection);
  const isDirty =
    draftChapter !== savedChapter || draftSection !== savedSection;
  const isBusy = saving || isApplying;

  const statusLabel = useMemo(() => {
    if (isApplying) return "Saving position…";
    if (isDirty) return "Unsaved position";
    return `Saved as Ch.${savedChapter} · Sec.${savedSection}`;
  }, [isApplying, isDirty, savedChapter, savedSection]);

  async function handleApply() {
    setFeedback(null);

    if (!isDirty) return;

    const conflict = findLessonWithChapterSection(
      courseLessons,
      draftChapter,
      draftSection,
      lesson.id,
    );
    if (conflict) {
      setFeedback({
        type: "error",
        message: duplicateLessonChapterSectionMessage(draftChapter, draftSection),
      });
      return;
    }

    setIsApplying(true);
    const ok = await onSave(lesson.id, {
      chapter: draftChapter,
      section: draftSection,
    });
    setIsApplying(false);

    if (!ok) {
      setFeedback({
        type: "error",
        message: "Could not save position. Check your connection and try again.",
      });
    }
  }

  function handleReset() {
    setChapter(String(savedChapter));
    setSection(String(savedSection));
    setFeedback(null);
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-md border px-3 py-3",
        isDirty
          ? "border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20"
          : "border-sky-100 bg-sky-50/40 dark:border-stone-700 dark:bg-stone-950/40",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-slate-700 dark:text-stone-300">
            Position in course
          </p>
          <p
            className={cn(
              "text-xs",
              isDirty
                ? "font-medium text-amber-800 dark:text-amber-200"
                : "text-slate-500 dark:text-stone-500",
            )}
          >
            {statusLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isDirty && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              disabled={isBusy}
              onClick={handleReset}
            >
              Reset
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="h-8"
            disabled={!isDirty || isBusy}
            onClick={() => void handleApply()}
          >
            {isApplying ? "Saving…" : "Update position"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <NumberStepper
          id={`${lesson.id}-chapter`}
          label="Chapter"
          value={chapter}
          onChange={setChapter}
          onEnter={() => void handleApply()}
          disabled={isBusy}
        />
        <NumberStepper
          id={`${lesson.id}-section`}
          label="Section"
          value={section}
          onChange={setSection}
          onEnter={() => void handleApply()}
          disabled={isBusy}
        />
      </div>

      {feedback && (
        <AdminActionFeedback
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
