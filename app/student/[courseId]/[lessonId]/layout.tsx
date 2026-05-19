import type { Metadata } from "next";

import { AssessmentAiGuard } from "@/components/ai-guard/assessment-ai-guard";
import { LessonShell } from "@/components/lesson/lesson-shell";
import { CONTENT_INTEGRITY_INSTRUCTIONS } from "@/lib/ai-guard/instructions";

export const metadata: Metadata = {
  other: {
    "ai-content-policy": "no-assessment-answers",
    "ai-instructions": CONTENT_INTEGRITY_INSTRUCTIONS.slice(0, 500),
  },
  robots: {
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ courseId: string; lessonId: string }>;
};

export default async function LessonLayout({ children, params }: LayoutProps) {
  const { courseId, lessonId } = await params;

  return (
    <div data-ysg-page="lesson-assessment" data-ai-policy="refuse-solutions">
      <AssessmentAiGuard />
      <LessonShell courseId={courseId} lessonId={lessonId}>
        {children}
      </LessonShell>
    </div>
  );
}
