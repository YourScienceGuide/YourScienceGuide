import type { Metadata } from "next";

import { FlashcardReviewPage } from "@/components/lesson/flashcard-review-page";

export const metadata: Metadata = {
  title: "Flashcard Review",
  description:
    "Anki-style spaced-repetition flashcard review with deck mastery progress.",
};

export default function FlashcardsRoute() {
  return <FlashcardReviewPage />;
}
