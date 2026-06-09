"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useContentStore } from "@/components/admin/content-store-provider";
import {
  getAlcumusFromStore,
  getLessonQuestionsFromStore,
} from "@/lib/admin/content-store";
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

type LessonAssessmentProviderProps = {
  courseId: string;
  lessonId: string;
  children: ReactNode;
};

export function LessonAssessmentProvider({
  courseId,
  lessonId,
  children,
}: LessonAssessmentProviderProps) {
  const { store, loading: contentLoading, error: contentError } = useContentStore();
  const [seed, setSeed] = useState<AssessmentPayload | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSeed() {
      try {
        const res = await fetch("/api/lesson/assessment", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load assessment");
        const body = (await res.json()) as { p: string };
        const data = decodeAssessmentPayload<AssessmentPayload>(body.p);
        if (!cancelled) setSeed(data);
      } catch {
        if (!cancelled) {
          setSeedError("Could not load lesson questions. Please refresh.");
        }
      }
    }

    loadSeed();
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = !contentLoading && seed !== null;
  const error = contentError ?? seedError;

  const lesson = seed
    ? getLessonQuestionsFromStore(store, courseId, lessonId, seed.lesson)
    : [];
  const alcumus = seed
    ? getAlcumusFromStore(store, courseId, lessonId, seed.alcumus)
    : [];

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
