export type Flashcard = {
  id: string;
  front: string;
  back: string;
  custom?: boolean;
};

export type CardState = "new" | "learning" | "review";

export type FlashcardProgress = {
  state: CardState;
  /** Scheduled interval in days (mock scheduler). */
  interval: number;
  ease: number;
  reps: number;
};

export type FlashcardEntry = Flashcard & {
  progress: FlashcardProgress;
};

export type FlashcardPhase = "question" | "answer";

export type AnkiRating = "again" | "hard" | "good" | "easy";

export type DeckState = {
  entries: FlashcardEntry[];
  queue: string[];
  currentCardId: string;
  phase: FlashcardPhase;
};
