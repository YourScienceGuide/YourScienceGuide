"use client";

import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getLessonTier } from "@/lib/guest/lesson-tiers";

export function LessonTierBadge({ lessonId }: { lessonId: string }) {
  const tier = getLessonTier(lessonId);

  if (tier === "preview") {
    return <Badge variant="preview">Preview</Badge>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-stone-500">
      <Lock className="size-3.5" aria-hidden />
      <span>Locked</span>
    </span>
  );
}
