"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useContentStore } from "@/components/admin/content-store-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { getLessonClient } from "@/lib/student/curriculum-client";
import { canGuestOpenLesson } from "@/lib/guest/guest-progress";

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
  const { isGuest, hasLessonAccess, openSignupModal } = useAuth();
  const { store } = useContentStore();
  const lesson = getLessonClient(store, courseId, lessonId);

  if (!lesson) {
    return children;
  }

  if (canGuestOpenLesson(lesson)) {
    return children;
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
            This lesson requires a subscription
          </h1>
          <p className="text-base text-slate-600 dark:text-stone-400">
            This lesson is not marked as Preview. Create an account to continue,
            then subscribe to unlock the full course.
          </p>
        </header>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => openSignupModal("locked")}>
            Sign up to continue
          </Button>
          <Button asChild variant="outline">
            <Link href={`/student/${courseId}`}>Back to course</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (hasLessonAccess) {
    return children;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Subscription required
        </h1>
        <p className="text-base text-slate-600 dark:text-stone-400">
          Your account is set up, but this lesson is behind the paywall. Switch to
          a Preview lesson or open billing to unlock subscriber lessons.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/parent/billing">Open billing</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/student/${courseId}`}>Back to course</Link>
        </Button>
      </div>
    </div>
  );
}
