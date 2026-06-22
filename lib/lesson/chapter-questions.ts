import type { AlcumusLevel } from "@/lib/lesson/alcumus-types";
import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { LessonQuestion } from "@/lib/lesson/types";

/** Max required end-of-chapter questions drawn from the easier bank. */
export const MAX_END_OF_CHAPTER_QUESTIONS = 4;

/** Levels 1–2 are eligible for the required assignment; 3–5 are extra practice only. */
export const EASY_DIFFICULTY_MAX = 2;

export type ChapterQuestion = LessonQuestion & {
  difficulty: AlcumusLevel;
};

export function isEasyChapterQuestion(question: ChapterQuestion): boolean {
  return question.difficulty <= EASY_DIFFICULTY_MAX;
}

export function stripChapterDifficulty(
  question: ChapterQuestion,
): LessonQuestion {
  const { difficulty: _d, ...lessonQuestion } = question;
  return lessonQuestion;
}

export function previewChapterSplit(bank: ChapterQuestion[]): {
  assignmentCandidates: number;
  assignmentSlots: number;
  practiceCount: number;
} {
  const easyCount = bank.filter(isEasyChapterQuestion).length;
  const hardCount = bank.length - easyCount;
  const assignmentSlots = Math.min(MAX_END_OF_CHAPTER_QUESTIONS, easyCount);
  const leftoverEasy = Math.max(0, easyCount - assignmentSlots);

  return {
    assignmentCandidates: easyCount,
    assignmentSlots,
    practiceCount: leftoverEasy + hardCount,
  };
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let state = hashSeed(seed) || 1;

  for (let i = copy.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function selectAssignmentQuestions(
  bank: ChapterQuestion[],
  seed: string,
): LessonQuestion[] {
  const easy = bank.filter(isEasyChapterQuestion);
  const count = Math.min(MAX_END_OF_CHAPTER_QUESTIONS, easy.length);
  if (count === 0) return [];

  return seededShuffle(easy, seed)
    .slice(0, count)
    .map(stripChapterDifficulty);
}

export function selectPracticeQuestions(
  bank: ChapterQuestion[],
  assignment: LessonQuestion[],
): ChapterQuestion[] {
  const assignedIds = new Set(assignment.map((q) => q.id));
  return bank.filter((q) => !assignedIds.has(q.id));
}

export function splitChapterBank(
  bank: ChapterQuestion[],
  assignmentSeed: string,
): { assignment: LessonQuestion[]; practice: ChapterQuestion[] } {
  const assignment = selectAssignmentQuestions(bank, assignmentSeed);
  const practice = selectPracticeQuestions(bank, assignment);
  return { assignment, practice };
}

export function alcumusProblemToChapterQuestion(
  problem: AlcumusProblem,
): ChapterQuestion | null {
  if (problem.type === "choice") {
    return {
      type: "multiple-choice",
      id: problem.id,
      prompt: problem.prompt,
      options: problem.options ?? [],
      correctIndex: problem.correctIndex ?? 0,
      hint: problem.hint,
      difficulty: problem.level,
    };
  }

  return {
    type: "short-answer",
    id: problem.id,
    prompt: problem.prompt,
    acceptedAnswers: problem.acceptedAnswers ?? [],
    hint: problem.hint,
    difficulty: problem.level,
  };
}

export function lessonQuestionToChapterQuestion(
  question: LessonQuestion,
  difficulty: AlcumusLevel = 1,
): ChapterQuestion {
  return { ...question, difficulty };
}

export function mergeLegacyQuestionBank(
  lessonQuestions: LessonQuestion[] = [],
  alcumusProblems: AlcumusProblem[] = [],
): ChapterQuestion[] {
  const byId = new Map<string, ChapterQuestion>();

  for (const question of lessonQuestions) {
    byId.set(question.id, lessonQuestionToChapterQuestion(question, 1));
  }

  for (const problem of alcumusProblems) {
    const converted = alcumusProblemToChapterQuestion(problem);
    if (converted) {
      byId.set(converted.id, converted);
    }
  }

  return [...byId.values()];
}

export function assignmentSeed(courseId: string, lessonId: string): string {
  return `${courseId}/${lessonId}`;
}
