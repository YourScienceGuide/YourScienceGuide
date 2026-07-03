import { describe, expect, it } from "vitest";

import {
  createInitialDeckState,
  deckCounts,
  masteryPercent,
  rateCard,
  ratingIntervalLabel,
  saveCardDefinition,
  showAnswer,
} from "@/lib/lesson/flashcard-machine";
import type { Flashcard } from "@/lib/lesson/flashcard-types";

const TEST_CARDS: Flashcard[] = [
  { id: "fc1", front: "Mitochondria", back: "Powerhouse of the cell" },
  { id: "fc2", front: "Ribosome", back: "" },
];

describe("flashcard machine", () => {
  it("creates deck with all cards in queue", () => {
    const state = createInitialDeckState(TEST_CARDS);
    expect(state.entries).toHaveLength(2);
    expect(state.queue).toHaveLength(2);
    expect(["question", "define"]).toContain(state.phase);
  });

  it("starts in define phase when the current card has no definition", () => {
    const state = createInitialDeckState([
      { id: "fc2", front: "Ribosome", back: "" },
    ]);
    expect(state.phase).toBe("define");
  });

  it("reveals answer phase", () => {
    const state = createInitialDeckState(TEST_CARDS);
    expect(showAnswer(state).phase).toBe("answer");
  });

  it("saves a student definition and returns to question phase", () => {
    const state = createInitialDeckState([
      { id: "fc2", front: "Ribosome", back: "" },
    ]);
    const saved = saveCardDefinition(state, "fc2", "Makes proteins");
    expect(saved.entries[0].back).toBe("Makes proteins");
    expect(saved.phase).toBe("question");
  });

  it("updates progress when rated good", () => {
    const state = createInitialDeckState([
      { id: "fc1", front: "Mitochondria", back: "Powerhouse of the cell" },
    ]);
    const rated = rateCard(state, "good");
    const entry = rated.entries.find((entry) => entry.id === state.currentCardId);
    expect(entry?.progress.reps).toBe(1);
    expect(entry?.progress.state).toBe("review");
    expect(rated.phase).toBe("question");
  });

  it("requeues card on again rating", () => {
    const state = createInitialDeckState(TEST_CARDS);
    const currentId = state.currentCardId;
    const rated = rateCard(state, "again");
    expect(rated.queue[0]).toBe(currentId);
  });

  it("tracks deck counts and mastery", () => {
    const state = createInitialDeckState(TEST_CARDS);
    const counts = deckCounts(state);
    expect(counts.new).toBe(2);
    expect(masteryPercent(state)).toBe(0);
  });

  it("provides interval labels for ratings", () => {
    const state = createInitialDeckState(TEST_CARDS);
    const entry = state.entries[0];
    expect(ratingIntervalLabel(entry, "again")).toBe("<1m");
    expect(ratingIntervalLabel(entry, "good")).toBeTruthy();
  });
});
