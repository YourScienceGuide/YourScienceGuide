import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FlashcardReviewPage } from "@/components/lesson/flashcard-review-page";
import { getCourse, getLesson } from "@/lib/student/curriculum";

type PageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export const metadata: Metadata = {
  title: "Flashcard Review",
  description:
    "Anki-style spaced-repetition flashcard review with deck mastery progress.",
};

export default async function FlashcardsRoute({ params }: PageProps) {
  const { courseId, lessonId } = await params;
  if (!getCourse(courseId) || !getLesson(courseId, lessonId)) {
    notFound();
  }

  return <FlashcardReviewPage courseId={courseId} lessonId={lessonId} />;
}
