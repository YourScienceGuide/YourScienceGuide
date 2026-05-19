"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getAlcumusFromStore,
  getLessonQuestionsFromStore,
  loadContentStore,
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

        const store = loadContentStore();
        setLesson(
          getLessonQuestionsFromStore(store, courseId, lessonId, data.lesson),
        );
        setAlcumus(
          getAlcumusFromStore(store, courseId, lessonId, data.alcumus),
        );
        setReady(true);
      } catch {
        if (!cancelled) {
          setError("Could not load lesson questions. Please refresh.");
        }
      }
    }

    load();

    const onContentUpdate = () => {
      load();
    };
    window.addEventListener("ysg-content-updated", onContentUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("ysg-content-updated", onContentUpdate);
    };
  }, [courseId, lessonId]);

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
