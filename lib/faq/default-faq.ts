import type { FaqContent, FaqEntry } from "@/lib/faq/types";

export const FAQ_PAGE_ID = "default";

export const DEFAULT_FAQ_CONTENT: FaqContent = {
  title: "Frequently asked questions",
  intro:
    "Answers to common questions about using Your Science Guide as a student or parent.",
  entries: [
    {
      id: "getting-started",
      question: "How do students start a lesson?",
      answer:
        "Sign in, open Student from the top navigation, choose your course, then select a lesson. Complete the review questions, watch the video, and work through the assignment at your own pace.",
      sortOrder: 0,
      published: true,
    },
    {
      id: "parent-progress",
      question: "How can parents see progress?",
      answer:
        "Sign in and open Parent from the top navigation. You can view lesson grades, pending free-response items to grade, and overall course progress for each student on your account.",
      sortOrder: 1,
      published: true,
    },
    {
      id: "flashcards",
      question: "How do flashcards work?",
      answer:
        "Each flashcard shows a term. Students write their own definition in their words, then check their answer. Progress is saved so they can review again later.",
      sortOrder: 2,
      published: true,
    },
  ],
};

export function createEmptyFaqEntry(sortOrder: number): FaqEntry {
  return {
    id: `faq-${Date.now()}`,
    question: "",
    answer: "",
    sortOrder,
    published: true,
  };
}
