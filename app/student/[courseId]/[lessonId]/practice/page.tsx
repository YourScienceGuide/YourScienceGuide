import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExtraPracticePage } from "@/components/lesson/extra-practice-page";
import { getCourse, getLesson } from "@/lib/student/curriculum";

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
  if (!getCourse(courseId) || !getLesson(courseId, lessonId)) {
    notFound();
  }

  return <ExtraPracticePage courseId={courseId} lessonId={lessonId} />;
}
