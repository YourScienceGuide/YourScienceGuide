import type { AdminContentStore } from "@/lib/admin/content-store";
import {
  getQuestionBankFromStore,
  getReviewQuestionsFromStore,
} from "@/lib/admin/content-store";
import type { AssignmentAlgorithmConfig } from "@/lib/lesson/assignment-algorithm-config";
import {
  DEFAULT_ASSIGNMENT_ALGORITHM,
  lessonUsesPriorReviewForMcFib,
  normalizeAssignmentAlgorithm,
} from "@/lib/lesson/assignment-algorithm-config";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import type { GradingRubricConfig } from "@/lib/lesson/lesson-grade-config";
import { normalizeGradingRubric } from "@/lib/lesson/lesson-grade-config";
import { selectFromPriorReviews } from "@/lib/lesson/lesson-assessment-plan";
import {
  lessonChapterNumber,
  lessonSectionNumber,
  sortLessons,
} from "@/lib/student/lesson-sort";
import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";

export type QuestionSourceRole =
  | "current-lesson"
  | "prior-section"
  | "prior-chapter"
  | "other-lesson"
  | "review-bank"
  | "prior-review";

export type PlanPhaseId =
  | "review"
  | "multiple-choice"
  | "fill-in-blank"
  | "extra-practice"
  | "free-response";

export type SourceBreakdown = {
  lessonId: string;
  lessonTitle: string;
  chapter: number;
  section: number;
  count: number;
  role: QuestionSourceRole;
};

export type PhaseExplanation = {
  id: PlanPhaseId;
  label: string;
  rule: string;
  requested: number;
  selected: number;
  available: number;
  sources: SourceBreakdown[];
  samplePrompts: string[];
};

export type LessonAlgorithmExplanation = {
  lessonId: string;
  lessonTitle: string;
  chapter: number;
  section: number;
  narrative: string[];
  bonusSplit: {
    easyAvailable: number;
    assignmentSlots: number;
    practicePool: number;
  };
  phases: PhaseExplanation[];
};

export type ChapterAlgorithmGroup = {
  chapter: number;
  chapterTitle: string;
  lessons: LessonAlgorithmExplanation[];
};

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

function truncatePrompt(prompt: string, max = 72): string {
  const trimmed = prompt.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function sourceFromLesson(
  lesson: CurriculumLesson,
  count: number,
  role: QuestionSourceRole,
): SourceBreakdown {
  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    chapter: lessonChapterNumber(lesson),
    section: lessonSectionNumber(lesson),
    count,
    role,
  };
}

function mergeSources(sources: SourceBreakdown[]): SourceBreakdown[] {
  const byKey = new Map<string, SourceBreakdown>();
  for (const source of sources) {
    const key = `${source.lessonId}:${source.role}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += source.count;
    } else {
      byKey.set(key, { ...source });
    }
  }
  return [...byKey.values()].filter((entry) => entry.count > 0);
}

function collectPriorReviewAvailable(
  store: AdminContentStore,
  course: Course,
  lesson: CurriculumLesson,
): number {
  const sorted = sortLessons(course.lessons);
  const currentIndex = sorted.findIndex((entry) => entry.id === lesson.id);
  if (currentIndex <= 0) return 0;
  let total = 0;
  for (let i = 0; i < currentIndex; i += 1) {
    total += getReviewQuestionsFromStore(store, course.id, sorted[i].id).length;
  }
  return total;
}

type TaggedQuestion = ChapterQuestion & {
  fromLesson: CurriculumLesson;
  role: QuestionSourceRole;
};

function selectExtraWithSources(
  store: AdminContentStore,
  course: Course,
  lesson: CurriculumLesson,
  count: number,
  seed: string,
  algorithm: AssignmentAlgorithmConfig,
): { questions: TaggedQuestion[]; narrative: string } {
  const sorted = sortLessons(course.lessons);
  const currentIndex = sorted.findIndex((entry) => entry.id === lesson.id);
  if (currentIndex < 0 || count <= 0) {
    return { questions: [], narrative: "No extra practice requested." };
  }

  const chapter = lessonChapterNumber(lesson);
  const section = lessonSectionNumber(lesson);
  const allOtherTagged: TaggedQuestion[] = [];
  const previousInChapter: TaggedQuestion[] = [];
  const previousChapter: TaggedQuestion[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const entry = sorted[i];
    if (entry.id === lesson.id) continue;
    const bank = getQuestionBankFromStore(store, course.id, entry.id);
    const entryChapter = lessonChapterNumber(entry);
    for (const question of bank) {
      let role: QuestionSourceRole = "other-lesson";
      if (entryChapter === chapter && i < currentIndex) {
        role = "prior-section";
        previousInChapter.push({ ...question, fromLesson: entry, role });
      } else if (entryChapter === chapter - 1 && i < currentIndex) {
        role = "prior-chapter";
        previousChapter.push({ ...question, fromLesson: entry, role });
      }
      allOtherTagged.push({
        ...question,
        fromLesson: entry,
        role:
          entryChapter === chapter && i < currentIndex
            ? "prior-section"
            : entryChapter === chapter - 1 && i < currentIndex
              ? "prior-chapter"
              : "other-lesson",
      });
    }
  }

  if (chapter === 1 && section === 1) {
    const picked = seededShuffle(allOtherTagged, seed).slice(0, count);
    return {
      questions: picked,
      narrative:
        "First lesson of the course: shuffle every other lesson’s bank and take the requested count.",
    };
  }

  const primaryPool =
    section === 1 ? previousChapter : previousInChapter;
  const primaryLabel =
    section === 1
      ? "previous chapter (first section of a new chapter)"
      : "earlier sections in this chapter";
  const primaryTake = Math.min(
    Math.max(0, algorithm.extraPrimaryPoolTake),
    count,
  );
  const fromPrimary = seededShuffle(primaryPool, `${seed}-primary`).slice(
    0,
    primaryTake,
  );
  const usedIds = new Set(fromPrimary.map((q) => q.id));
  const restPool = allOtherTagged.filter((q) => !usedIds.has(q.id));
  const fromRest = seededShuffle(restPool, `${seed}-rest`).slice(
    0,
    count - fromPrimary.length,
  );

  return {
    questions: [...fromPrimary, ...fromRest].slice(0, count),
    narrative: `Take up to ${primaryTake} from ${primaryLabel}, then fill remaining slots from the rest of the course (excluding the current lesson).`,
  };
}

function phaseFromBank(
  id: PlanPhaseId,
  label: string,
  rule: string,
  lesson: CurriculumLesson,
  bank: ChapterQuestion[],
  type: ChapterQuestion["type"],
  requested: number,
): PhaseExplanation {
  const available = bank.filter((q) => q.type === type).length;
  const selectedQs = bank.filter((q) => q.type === type).slice(0, requested);
  return {
    id,
    label,
    rule,
    requested,
    selected: selectedQs.length,
    available,
    sources:
      selectedQs.length > 0
        ? [sourceFromLesson(lesson, selectedQs.length, "current-lesson")]
        : [],
    samplePrompts: selectedQs.slice(0, 3).map((q) => truncatePrompt(q.prompt)),
  };
}

export function explainLessonAssessmentPlan(
  store: AdminContentStore,
  course: Course,
  lesson: CurriculumLesson,
  rubricInput?: Partial<GradingRubricConfig> | null,
  algorithmInput?: Partial<AssignmentAlgorithmConfig> | null,
): LessonAlgorithmExplanation {
  const rubric = normalizeGradingRubric(rubricInput);
  const algorithm = normalizeAssignmentAlgorithm(algorithmInput);
  const bank = getQuestionBankFromStore(store, course.id, lesson.id);
  const reviewAll = getReviewQuestionsFromStore(store, course.id, lesson.id);
  const seed = `${course.id}/${lesson.id}/extra`;
  const chapter = lessonChapterNumber(lesson);
  const section = lessonSectionNumber(lesson);

  const reviewSelected = reviewAll.slice(0, rubric.reviewCount);
  const reviewPhase: PhaseExplanation = {
    id: "review",
    label: "Review (warm-up)",
    rule: `Take the first ${rubric.reviewCount} questions from this lesson’s dedicated review bank (admin Review tab), in stored order.`,
    requested: rubric.reviewCount,
    selected: reviewSelected.length,
    available: reviewAll.length,
    sources:
      reviewSelected.length > 0
        ? [
            {
              ...sourceFromLesson(lesson, reviewSelected.length, "review-bank"),
            },
          ]
        : [],
    samplePrompts: reviewSelected
      .slice(0, 3)
      .map((q) => truncatePrompt(q.prompt)),
  };

  const usePriorReviews = lessonUsesPriorReviewForMcFib(algorithm, lesson);
  const excludeIds = new Set(reviewSelected.map((q) => q.id));

  let mcPhase: PhaseExplanation;
  let fibPhase: PhaseExplanation;

  if (usePriorReviews) {
    const mcTagged = selectFromPriorReviews(
      store,
      course,
      lesson,
      "multiple-choice",
      rubric.mcBankSize,
      `${seed}-mc-prior`,
      excludeIds,
    );
    for (const question of mcTagged) excludeIds.add(question.id);
    const fibTagged = selectFromPriorReviews(
      store,
      course,
      lesson,
      "fill-in-the-blank",
      rubric.fibCount,
      `${seed}-fib-prior`,
      excludeIds,
    );

    const lessonById = new Map(
      course.lessons.map((entry) => [entry.id, entry] as const),
    );

    mcPhase = {
      id: "multiple-choice",
      label: "Multiple choice (prior reviews)",
      rule: `Chapter ${chapter} is configured to reuse prior lessons’ review banks for MC. Prefer matching MC types, then fill from other prior review questions. Students need ${rubric.mcTargetCorrect} correct to finish.`,
      requested: rubric.mcBankSize,
      selected: mcTagged.length,
      available: collectPriorReviewAvailable(store, course, lesson),
      sources: mergeSources(
        mcTagged.map((question) => {
          const from = lessonById.get(question.fromLessonId) ?? lesson;
          return sourceFromLesson(from, 1, "prior-review");
        }),
      ),
      samplePrompts: mcTagged.slice(0, 3).map((q) => truncatePrompt(q.prompt)),
    };

    fibPhase = {
      id: "fill-in-blank",
      label: "Fill in the blank (prior reviews)",
      rule: `Chapter ${chapter} is configured to reuse prior lessons’ review banks for fill-in-blank. Prefer FIB types, then fill from other prior review questions.`,
      requested: rubric.fibCount,
      selected: fibTagged.length,
      available: collectPriorReviewAvailable(store, course, lesson),
      sources: mergeSources(
        fibTagged.map((question) => {
          const from = lessonById.get(question.fromLessonId) ?? lesson;
          return sourceFromLesson(from, 1, "prior-review");
        }),
      ),
      samplePrompts: fibTagged.slice(0, 3).map((q) => truncatePrompt(q.prompt)),
    };
  } else {
    mcPhase = phaseFromBank(
      "multiple-choice",
      "Multiple choice",
      `Take the first ${rubric.mcBankSize} multiple-choice items from this lesson’s chapter question bank (difficulty ignored for the graded path). Students need ${rubric.mcTargetCorrect} correct to finish the phase.`,
      lesson,
      bank,
      "multiple-choice",
      rubric.mcBankSize,
    );

    fibPhase = phaseFromBank(
      "fill-in-blank",
      "Fill in the blank",
      `Take the first ${rubric.fibCount} fill-in-the-blank items from this lesson’s chapter bank.`,
      lesson,
      bank,
      "fill-in-the-blank",
      rubric.fibCount,
    );
  }

  const frPhase = phaseFromBank(
    "free-response",
    "Free response",
    `Take up to ${rubric.freeResponseCount} long-answer item(s) from this lesson’s chapter bank (parent-graded).`,
    lesson,
    bank,
    "long-answer",
    rubric.freeResponseCount,
  );

  const extra = selectExtraWithSources(
    store,
    course,
    lesson,
    rubric.extraCount,
    seed,
    algorithm,
  );
  const extraSources = mergeSources(
    extra.questions.map((q) =>
      sourceFromLesson(q.fromLesson, 1, q.role),
    ),
  );
  const extraPhase: PhaseExplanation = {
    id: "extra-practice",
    label: "Graded extra / cross-lesson review",
    rule: extra.narrative,
    requested: rubric.extraCount,
    selected: extra.questions.length,
    available: Math.max(
      0,
      sortLessons(course.lessons)
        .filter((entry) => entry.id !== lesson.id)
        .reduce(
          (sum, entry) =>
            sum + getQuestionBankFromStore(store, course.id, entry.id).length,
          0,
        ),
    ),
    sources: extraSources,
    samplePrompts: extra.questions
      .slice(0, 3)
      .map((q) => truncatePrompt(q.prompt)),
  };

  const easyAvailable = bank.filter(
    (q) => q.difficulty <= algorithm.easyDifficultyMax,
  ).length;
  const assignmentSlots = Math.min(
    algorithm.maxEndOfChapterQuestions,
    easyAvailable,
  );
  const practicePool = bank.length - assignmentSlots;

  const narrative = [
    `Lesson ${chapter}.${section}: ${lesson.title}`,
    "Graded order: Review → Multiple choice → Fill-in-blank → Extra practice → Free response (empty phases skipped).",
    usePriorReviews
      ? `Chapter ${chapter} uses prior lessons’ review banks for MC and fill-in-blank (admin Algorithm setting).`
      : `Chapter bank has ${bank.length} question(s); review bank has ${reviewAll.length}.`,
    `Bonus practice path (optional /practice): up to ${assignmentSlots} sticky easy questions (difficulty ≤ ${algorithm.easyDifficultyMax}); leftover ${Math.max(0, practicePool)} feed Alcumus sessions of ${algorithm.extraPracticeSessionSize}.`,
  ];

  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    chapter,
    section,
    narrative,
    bonusSplit: {
      easyAvailable,
      assignmentSlots,
      practicePool: Math.max(0, practicePool),
    },
    phases: [reviewPhase, mcPhase, fibPhase, extraPhase, frPhase],
  };
}

export function explainCourseAssessmentByChapter(
  store: AdminContentStore,
  course: Course,
  rubricInput?: Partial<GradingRubricConfig> | null,
  algorithmInput?: Partial<AssignmentAlgorithmConfig> | null,
): ChapterAlgorithmGroup[] {
  const rubric = normalizeGradingRubric(rubricInput);
  const algorithm = normalizeAssignmentAlgorithm(
    algorithmInput ?? DEFAULT_ASSIGNMENT_ALGORITHM,
  );
  const sorted = sortLessons(course.lessons);
  const groups = new Map<number, ChapterAlgorithmGroup>();

  for (const lesson of sorted) {
    const chapter = lessonChapterNumber(lesson);
    const explanation = explainLessonAssessmentPlan(
      store,
      course,
      lesson,
      rubric,
      algorithm,
    );
    const existing = groups.get(chapter);
    if (existing) {
      existing.lessons.push(explanation);
    } else {
      groups.set(chapter, {
        chapter,
        chapterTitle: lesson.chapterTitle || `Chapter ${chapter}`,
        lessons: [explanation],
      });
    }
  }

  return [...groups.values()].sort((a, b) => a.chapter - b.chapter);
}
