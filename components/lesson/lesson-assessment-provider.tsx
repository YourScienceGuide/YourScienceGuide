"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { decodeAssessmentPayload } from "@/lib/ai-guard/encode";
import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { LessonQuestion } from "@/lib/lesson/types";

type AssessmentPayload = {
  lesson: LessonQuestion[];
  alcumus: AlcumusProblem[];
};

type LessonAssessmentContextValue = {
  lesson: LessonQuestion[];
  alcumus: AlcumusProblem[];
  ready: boolean;
  error: string | null;
};

const LessonAssessmentContext = createContext<LessonAssessmentContextValue | null>(
  null,
);

export function LessonAssessmentProvider({ children }: { children: ReactNode }) {
  const [lesson, setLesson] = useState<LessonQuestion[]>([]);
  const [alcumus, setAlcumus] = useState<AlcumusProblem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/lesson/assessment", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load assessment");
        const body = (await res.json()) as { p: string };
        const data = decodeAssessmentPayload<AssessmentPayload>(body.p);
        if (cancelled) return;
        setLesson(data.lesson);
        setAlcumus(data.alcumus);
        setReady(true);
      } catch {
        if (!cancelled) setError("Could not load lesson questions. Please refresh.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LessonAssessmentContext.Provider
      value={{ lesson, alcumus, ready, error }}
    >
      {children}
    </LessonAssessmentContext.Provider>
  );
}

export function useLessonAssessment() {
  const ctx = useContext(LessonAssessmentContext);
  if (!ctx) {
    throw new Error("useLessonAssessment must be used within LessonAssessmentProvider");
  }
  return ctx;
}
