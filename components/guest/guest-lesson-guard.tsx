"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { canGuestOpenLesson } from "@/lib/guest/guest-progress";
import { isAdvancedLesson } from "@/lib/guest/lesson-tiers";

type GuestLessonGuardProps = {
  courseId: string;
  lessonId: string;
  children: ReactNode;
};

export function GuestLessonGuard({
  courseId,
  lessonId,
  children,
}: GuestLessonGuardProps) {
  const { isGuest, openSignupModal } = useAuth();

  if (!isGuest) {
    return children;
  }

  if (canGuestOpenLesson(courseId, lessonId)) {
    return children;
  }

  const reason = isAdvancedLesson(lessonId) ? "locked" : "limit";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          {reason === "locked"
            ? "This lesson is locked"
            : "Guest preview limit reached"}
        </h1>
        <p className="text-base text-slate-600 dark:text-stone-400">
          {reason === "locked"
            ? "Advanced lessons need an account. Try a Preview lesson or sign up for full access."
            : "You've used both free preview lessons. Sign up to continue and save your progress."}
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => openSignupModal(reason)}>
          Sign up to continue
        </Button>
        <Button asChild variant="outline">
          <Link href={`/student/${courseId}`}>Back to course</Link>
        </Button>
      </div>
    </div>
  );
}
