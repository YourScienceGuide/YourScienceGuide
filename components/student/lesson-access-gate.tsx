"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function LessonAccessGate({ children }: { children: ReactNode }) {
  const { ready, hasLessonAccess } = useAuth();

  if (!ready) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400" aria-live="polite">
        Loading…
      </p>
    );
  }

  if (!hasLessonAccess) {
    return <NoLessonAccessPrompt />;
  }

  return children;
}

function NoLessonAccessPrompt() {
  return (
    <div className="mx-auto max-w-lg space-y-6 text-center sm:text-left">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Lessons not yet unlocked
        </h1>
        <p className="text-base text-slate-600 dark:text-stone-400">
          Your account is set up, but course access requires an active
          subscription. Choose a monthly or annual plan in the parent portal to
          start learning.
        </p>
      </header>
      <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
        <Button asChild>
          <Link href="/parent">Go to parent portal</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}
