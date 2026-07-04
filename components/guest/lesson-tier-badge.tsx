"use client";

import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CurriculumLesson } from "@/lib/student/curriculum-types";
import { isPreviewLesson } from "@/lib/student/lesson-access";

export function LessonTierBadge({
  lesson,
}: {
  lesson: Pick<CurriculumLesson, "id" | "accessTier">;
}) {
  if (isPreviewLesson(lesson)) {
    return <Badge variant="preview">Preview</Badge>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-stone-500">
      <Lock className="size-3.5" aria-hidden />
      <span>Subscription</span>
    </span>
  );
}
