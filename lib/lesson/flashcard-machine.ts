import type {
  AnkiRating,
  CardState,
  DeckState,
  Flashcard,
  FlashcardEntry,
  FlashcardPhase,
  FlashcardProgress,
} from "@/lib/lesson/flashcard-types";

const DEFAULT_EASE = 2.5;

function initialProgress(): FlashcardProgress {
  return { state: "new", interval: 0, ease: DEFAULT_EASE, reps: 0 };
}

function toEntry(card: Flashcard, progress?: FlashcardProgress): FlashcardEntry {
  return { ...card, progress: progress ?? initialProgress() };
}

function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function phaseForEntry(entry: FlashcardEntry | undefined): FlashcardPhase {
  if (!entry) return "question";
  if (!entry.back.trim()) return "define";
  return "question";
}

export function createEmptyDeckState(): DeckState {
  return {
    entries: [],
    queue: [],
    currentCardId: "",
    phase: "question",
  };
}

export function createInitialDeckState(cards: Flashcard[] = []): DeckState {
  if (cards.length === 0) {
    return createEmptyDeckState();
  }

  const entries = cards.map((card) => toEntry(card));
  const queue = shuffleIds(entries.map((entry) => entry.id));
  const currentCardId = queue[0];
  const current = entries.find((entry) => entry.id === currentCardId);

  return {
    entries,
    queue,
    currentCardId,
    phase: phaseForEntry(current),
  };
}

export function mergeDeckWithCards(
  persisted: DeckState,
  cards: Flashcard[],
): DeckState {
  if (cards.length === 0) {
    return createEmptyDeckState();
  }

  const progressById = new Map(
    persisted.entries.map((entry) => [entry.id, entry.progress]),
  );
  const entries = cards.map((card) =>
    toEntry(card, progressById.get(card.id)),
  );
  const cardIds = new Set(cards.map((card) => card.id));
  const queue = persisted.queue.filter((id) => cardIds.has(id));
  const missing = entries
    .map((entry) => entry.id)
    .filter((id) => !queue.includes(id));
  const nextQueue = [...queue, ...shuffleIds(missing)];
  const currentCardId = nextQueue.includes(persisted.currentCardId)
    ? persisted.currentCardId
    : nextQueue[0];
  const current = entries.find((entry) => entry.id === currentCardId);

  return {
    entries,
    queue: nextQueue,
    currentCardId,
    phase: phaseForEntry(current),
  };
}

export function getCurrentCard(state: DeckState): FlashcardEntry | null {
  if (!state.currentCardId) return state.entries[0] ?? null;
  return (
    state.entries.find((entry) => entry.id === state.currentCardId) ??
    state.entries[0] ??
    null
  );
}

export function deckCounts(state: DeckState) {
  const counts = { new: 0, learning: 0, review: 0 };
  for (const entry of state.entries) {
    counts[entry.progress.state]++;
  }
  return counts;
}

export function masteryPercent(state: DeckState): number {
  if (state.entries.length === 0) return 0;
  let score = 0;
  for (const entry of state.entries) {
    if (entry.progress.state === "review") score += 1;
    else if (entry.progress.state === "learning") score += 0.4;
  }
  return Math.min(100, Math.round((score / state.entries.length) * 100));
}

export function masteryStepLabel(state: DeckState): string {
  const counts = deckCounts(state);
  const defined = state.entries.filter((entry) => entry.back.trim()).length;
  const mature = counts.review;
  const total = state.entries.length;
  return `${defined} defined · ${mature} of ${total} in review`;
}

export function definitionsProgress(state: DeckState): {
  defined: number;
  total: number;
} {
  const total = state.entries.length;
  const defined = state.entries.filter((entry) => entry.back.trim()).length;
  return { defined, total };
}

export function showAnswer(state: DeckState): DeckState {
  return { ...state, phase: "answer" };
}

export function saveCardDefinition(
  state: DeckState,
  cardId: string,
  definition: string,
): DeckState {
  const trimmed = definition.trim();
  if (!trimmed) return state;

  const entries = state.entries.map((entry) =>
    entry.id === cardId ? { ...entry, back: trimmed } : entry,
  );

  return {
    ...state,
    entries,
    phase: "question",
  };
}

function updateEntry(
  entry: FlashcardEntry,
  rating: AnkiRating,
): FlashcardEntry {
  const { progress } = entry;
  let { state, interval, ease, reps } = progress;

  if (rating === "again") {
    return {
      ...entry,
      progress: {
        state: "learning",
        interval: 0,
        ease: Math.max(1.3, ease - 0.2),
        reps,
      },
    };
  }

  reps += 1;

  if (rating === "hard") {
    const nextState: CardState = state === "new" ? "learning" : state;
    return {
      ...entry,
      progress: {
        state: nextState,
        interval: interval === 0 ? 1 : Math.max(1, Math.round(interval * 1.2)),
        ease: Math.max(1.3, ease - 0.15),
        reps,
      },
    };
  }

  if (rating === "good") {
    const nextState: CardState = "review";
    const nextInterval =
      interval === 0 ? 1 : Math.max(1, Math.round(interval * ease));
    return {
      ...entry,
      progress: {
        state: nextState,
        interval: nextInterval,
        ease,
        reps,
      },
    };
  }

  const nextInterval =
    interval === 0 ? 4 : Math.max(1, Math.round(interval * ease * 1.3));
  return {
    ...entry,
    progress: {
      state: "review",
      interval: nextInterval,
      ease: ease + 0.15,
      reps,
    },
  };
}

function buildQueueAfterRating(
  state: DeckState,
  ratedId: string,
  rating: AnkiRating,
): string[] {
  const rest = state.queue.filter((id) => id !== ratedId);
  if (rating === "again") {
    return [ratedId, ...rest];
  }
  if (rating === "hard") {
    return [...rest.slice(0, 1), ratedId, ...rest.slice(1)];
  }
  return rest;
}

function nextCardId(queue: string[], entries: FlashcardEntry[]): string {
  if (queue.length > 0) return queue[0];
  return entries[0]?.id ?? "";
}

export function rateCard(state: DeckState, rating: AnkiRating): DeckState {
  const current = getCurrentCard(state);
  if (!current) return state;

  const updated = updateEntry(current, rating);
  const entries = state.entries.map((entry) =>
    entry.id === updated.id ? updated : entry,
  );
  const queue = buildQueueAfterRating(state, current.id, rating);
  const currentCardId = nextCardId(queue, entries);
  const next = entries.find((entry) => entry.id === currentCardId);

  return {
    entries,
    queue,
    currentCardId,
    phase: phaseForEntry(next),
  };
}

/** Mock interval labels shown on Anki-style rating buttons. */
export function ratingIntervalLabel(
  entry: FlashcardEntry,
  rating: AnkiRating,
): string {
  const preview = updateEntry(entry, rating);
  const days = preview.progress.interval;
  if (rating === "again") return "<1m";
  if (days === 0) return "<10m";
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}
