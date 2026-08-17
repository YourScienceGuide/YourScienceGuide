/** Blanks in prompts are marked with four or more consecutive underscores. */
export const BLANK_PATTERN = /_{4,}/g;

export function countBlanks(prompt: string): number {
  return prompt.match(BLANK_PATTERN)?.length ?? 0;
}

export function splitPromptOnBlanks(prompt: string): string[] {
  return prompt.split(/_{4,}/);
}

function normalizeBlankAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * True if `source` can be turned into `target` using at most `maxInserts`
 * character insertions and `maxDeletes` character deletions (any order).
 */
export function withinInsertDeleteBudget(
  source: string,
  target: string,
  maxInserts: number,
  maxDeletes: number,
): boolean {
  if (source === target) return true;
  if (target.length - source.length > maxInserts) return false;
  if (source.length - target.length > maxDeletes) return false;

  const memo = new Map<string, boolean>();

  function dfs(i: number, j: number, insertsLeft: number, deletesLeft: number): boolean {
    if (i === source.length && j === target.length) return true;

    const remainingSource = source.length - i;
    const remainingTarget = target.length - j;
    if (remainingTarget - remainingSource > insertsLeft) return false;
    if (remainingSource - remainingTarget > deletesLeft) return false;

    const key = `${i},${j},${insertsLeft},${deletesLeft}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    let ok = false;
    if (i < source.length && j < target.length && source[i] === target[j]) {
      ok = dfs(i + 1, j + 1, insertsLeft, deletesLeft);
    }
    if (!ok && deletesLeft > 0 && i < source.length) {
      ok = dfs(i + 1, j, insertsLeft, deletesLeft - 1);
    }
    if (!ok && insertsLeft > 0 && j < target.length) {
      ok = dfs(i, j + 1, insertsLeft - 1, deletesLeft);
    }

    memo.set(key, ok);
    return ok;
  }

  return dfs(0, 0, maxInserts, maxDeletes);
}

export type BlankAnswerCheck = "correct" | "spelling" | "incorrect";

export function checkBlankAnswer(
  acceptedVariants: string[],
  value: string,
): BlankAnswerCheck {
  const normalized = normalizeBlankAnswer(value);
  if (!normalized) return "incorrect";

  for (const accepted of acceptedVariants) {
    const target = normalizeBlankAnswer(accepted);
    if (
      target === normalized ||
      withinInsertDeleteBudget(normalized, target, 1, 1)
    ) {
      return "correct";
    }
  }

  for (const accepted of acceptedVariants) {
    const target = normalizeBlankAnswer(accepted);
    const maxDistance = target.length <= 4 ? 1 : 2;
    if (levenshtein(normalized, target) <= maxDistance) {
      return "spelling";
    }
  }

  return "incorrect";
}

export function checkFillInBlankQuestion(
  blankAnswers: string[][],
  values: string[],
): { correct: boolean; spellingHint: boolean } {
  const blankCount = blankAnswers.length;
  if (blankCount === 0 || values.length < blankCount) {
    return { correct: false, spellingHint: false };
  }

  for (let i = 0; i < blankCount; i += 1) {
    const result = checkBlankAnswer(blankAnswers[i] ?? [], values[i] ?? "");
    if (result === "correct") continue;
    if (result === "spelling") {
      return { correct: false, spellingHint: true };
    }
    return { correct: false, spellingHint: false };
  }

  return { correct: true, spellingHint: false };
}

export const FILL_IN_BLANK_SPELLING_HINT = "Check your spelling.";
