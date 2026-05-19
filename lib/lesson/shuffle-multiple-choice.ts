import type { MultipleChoiceQuestion } from "@/lib/lesson/types";

export type ShuffledMultipleChoice = {
  options: string[];
  correctIndex: number;
};

export function shuffleMultipleChoice(
  question: MultipleChoiceQuestion,
): ShuffledMultipleChoice {
  const order = question.options.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const options = order.map((i) => question.options[i]);
  const correctIndex = order.indexOf(question.correctIndex);
  return { options, correctIndex };
}
