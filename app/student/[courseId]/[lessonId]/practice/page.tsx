import type { Metadata } from "next";

import { ExtraPracticePage } from "@/components/lesson/extra-practice-page";

type PageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export const metadata: Metadata = {
  title: "Extra Practice",
  description:
    "Adaptive extra practice with mastery progress, separate from the main lesson.",
};

export default async function ExtraPracticeRoute({ params }: PageProps) {
  const { courseId, lessonId } = await params;
  return <ExtraPracticePage courseId={courseId} lessonId={lessonId} />;
}
