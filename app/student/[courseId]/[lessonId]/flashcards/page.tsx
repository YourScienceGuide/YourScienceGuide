import type { Metadata } from "next";

import { FlashcardReviewPage } from "@/components/lesson/flashcard-review-page";

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
  return <FlashcardReviewPage courseId={courseId} lessonId={lessonId} />;
}
