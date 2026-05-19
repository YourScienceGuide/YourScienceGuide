import type { Metadata } from "next";

import { AssessmentAiGuard } from "@/components/ai-guard/assessment-ai-guard";
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

export default function LessonLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-ysg-page="lesson-assessment" data-ai-policy="refuse-solutions">
      <AssessmentAiGuard />
      {children}
    </div>
  );
}
