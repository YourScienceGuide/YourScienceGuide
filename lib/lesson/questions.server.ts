import "server-only";

import type { LessonQuestion } from "@/lib/lesson/types";

/** Server-only — served via /api/lesson/assessment, not bundled for client. */
export const LESSON_QUESTIONS: LessonQuestion[] = [
  {
    type: "multiple-choice",
    id: "q1",
    prompt:
      "A plant cell has a rigid outer layer. What is this structure called?",
    options: ["Mitochondria", "Cell wall", "Nucleus", "Cytoplasm"],
    correctIndex: 1,
  },
  {
    type: "short-answer",
    id: "q2",
    prompt:
      "If you mix 1/4 cup of vinegar with 3/4 cup of water, what fraction of the mixture is vinegar? (Enter as a fraction or decimal.)",
    acceptedAnswers: ["1/4", "0.25", ".25", "¼", "one fourth", "one-quarter"],
  },
  {
    type: "long-answer",
    id: "q3",
    prompt:
      "Explain in your own words why plants need sunlight for photosynthesis. Include at least one reason and one result of the process.",
    minLength: 40,
  },
];
