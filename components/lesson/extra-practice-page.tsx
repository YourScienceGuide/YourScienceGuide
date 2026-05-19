"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AlcumusPractice } from "@/components/lesson/alcumus-practice";
import { useLessonAssessment } from "@/components/lesson/lesson-assessment-provider";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import { Button } from "@/components/ui/button";
import {
  createInitialAlcumusState,
  masteryPercent,
  masteryStepLabel,
  type AlcumusState,
} from "@/lib/lesson/alcumus-machine";

const ALCUMUS_STORAGE_KEY = "ysg-alcumus-state";

function loadPersistedState(pool: { id: string }[]): AlcumusState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ALCUMUS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AlcumusState;
    if (!pool.some((p) => p.id === parsed.problemId)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function ExtraPracticePage() {
  const { alcumus, ready, error } = useLessonAssessment();
  const [state, setState] = useState<AlcumusState | null>(null);

  useEffect(() => {
    if (ready && alcumus.length > 0 && !state) {
      setState(loadPersistedState(alcumus) ?? createInitialAlcumusState(alcumus));
    }
  }, [ready, alcumus, state]);

  useEffect(() => {
    if (!state) return;
    sessionStorage.setItem(ALCUMUS_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const onStateChange = useCallback((next: AlcumusState) => {
    setState(next);
  }, []);

  if (error) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  if (!ready || !state) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading extra practice…
      </p>
    );
  }

  const percent = masteryPercent(state);
  const stepLabel = masteryStepLabel(state);

  return (
    <div className="space-y-8">
      <LessonProgressRail
        percent={percent}
        stepLabel={`Mastery · ${stepLabel}`}
        ariaLabel="Practice mastery progress"
        trailing={
          <Button variant="ghost" asChild size="sm" className="shrink-0 self-end sm:self-center">
            <Link href="/lesson">
              <ArrowLeft aria-hidden />
              Back to lesson
            </Link>
          </Button>
        }
      />

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Extra Practice
        </h1>
        <p className="text-base text-slate-600 dark:text-stone-400">
          Adaptive problems that adjust to your skill—like AoPS Alcumus. Progress
          here is separate from your lesson assignment.
        </p>
      </header>

      <AlcumusPractice state={state} onStateChange={onStateChange} />
    </div>
  );
}
