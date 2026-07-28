/** True when the MC bank is smaller than the usual “target correct” threshold. */
export function isMcAnswerAllMode(total: number, targetCorrect: number): boolean {
  return total > 0 && total < targetCorrect;
}

export function mcPhaseDescription(
  total: number,
  targetCorrect: number,
): string {
  if (isMcAnswerAllMode(total, targetCorrect)) {
    return `Work through ${total} questions. Answer all ${total} questions.`;
  }
  return `Work through ${total} questions. Answer ${targetCorrect} correctly to finish this section.`;
}

export function remainingCorrectNeeded(
  correct: number,
  targetCorrect: number,
): number {
  return Math.max(0, targetCorrect - correct);
}
