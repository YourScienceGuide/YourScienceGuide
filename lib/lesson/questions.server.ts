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
    hint: "Think about what gives plant cells their shape and support.",
  },
  {
    type: "short-answer",
    id: "q2",
    prompt:
      "If you mix 1/4 cup of vinegar with 3/4 cup of water, what fraction of the mixture is vinegar? (Enter as a fraction or decimal.)",
    acceptedAnswers: ["1/4", "0.25", ".25", "¼", "one fourth", "one-quarter"],
    hint: "The vinegar is one part out of four equal parts in the mixture.",
  },
  {
    type: "long-answer",
    id: "q3",
    prompt:
      "Explain in your own words why plants need sunlight for photosynthesis. Include at least one reason and one result of the process.",
    minLength: 40,
    hint: "Consider what chlorophyll captures and what the plant produces.",
  },
];
