export type AlcumusLevel = 1 | 2 | 3 | 4 | 5;

export type AlcumusProblem = {
  id: string;
  level: AlcumusLevel;
  prompt: string;
  type: "choice" | "numeric";
  options?: string[];
  correctIndex?: number;
  acceptedAnswers?: string[];
  hint?: string;
};
