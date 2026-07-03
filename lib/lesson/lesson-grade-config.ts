export type GradingRubricConfig = {
  reviewCount: number;
  reviewPointsEach: number;
  mcBankSize: number;
  mcTargetCorrect: number;
  mcPointsEach: number;
  fibCount: number;
  fibPointsEach: number;
  extraCount: number;
  extraPointsEach: number;
  freeResponseCount: number;
  freeResponsePoints: number;
  defaultGraduationProblemCount: number;
};

export const DEFAULT_GRADING_RUBRIC: GradingRubricConfig = {
  reviewCount: 4,
  reviewPointsEach: 1,
  mcBankSize: 15,
  mcTargetCorrect: 9,
  mcPointsEach: 2,
  fibCount: 4,
  fibPointsEach: 2,
  extraCount: 5,
  extraPointsEach: 2,
  freeResponseCount: 1,
  freeResponsePoints: 10,
  defaultGraduationProblemCount: 18,
};

export type RubricLineItem = {
  id: string;
  label: string;
  count: number;
  pointsEach: number;
  maxPoints: number;
  parentGraded?: boolean;
  description: string;
};

export function rubricLineItems(config: GradingRubricConfig): RubricLineItem[] {
  return [
    {
      id: "review",
      label: "Review questions",
      count: config.reviewCount,
      pointsEach: config.reviewPointsEach,
      maxPoints: config.reviewCount * config.reviewPointsEach,
      description: "Warm-up before the lesson video.",
    },
    {
      id: "multiple-choice",
      label: "Multiple choice",
      count: config.mcTargetCorrect,
      pointsEach: config.mcPointsEach,
      maxPoints: config.mcTargetCorrect * config.mcPointsEach,
      description: `Up to ${config.mcTargetCorrect} correct from a bank of ${config.mcBankSize}, in order.`,
    },
    {
      id: "fill-in-blank",
      label: "Fill in the blank",
      count: config.fibCount,
      pointsEach: config.fibPointsEach,
      maxPoints: config.fibCount * config.fibPointsEach,
      description: "End-of-section vocabulary and concepts.",
    },
    {
      id: "extra-practice",
      label: "Review / extra practice",
      count: config.extraCount,
      pointsEach: config.extraPointsEach,
      maxPoints: config.extraCount * config.extraPointsEach,
      description: "Mixed review from earlier sections and the curriculum.",
    },
    {
      id: "free-response",
      label: "Free response",
      count: config.freeResponseCount,
      pointsEach: config.freeResponsePoints,
      maxPoints: config.freeResponseCount * config.freeResponsePoints,
      parentGraded: true,
      description: "Longer written response graded by a parent.",
    },
  ];
}

export function maxLessonScore(config: GradingRubricConfig): number {
  return rubricLineItems(config).reduce((sum, item) => sum + item.maxPoints, 0);
}

export function graduationThresholdForLesson(
  config: GradingRubricConfig,
  lessonGraduationProblemCount?: number,
): number {
  return lessonGraduationProblemCount ?? config.defaultGraduationProblemCount;
}

export function letterGradeFromPercent(percent: number): string {
  if (percent >= 97) return "A+";
  if (percent >= 93) return "A";
  if (percent >= 90) return "A-";
  if (percent >= 87) return "B+";
  if (percent >= 83) return "B";
  if (percent >= 80) return "B-";
  if (percent >= 77) return "C+";
  if (percent >= 73) return "C";
  if (percent >= 70) return "C-";
  if (percent >= 67) return "D+";
  if (percent >= 63) return "D";
  if (percent >= 60) return "D-";
  return "F";
}

export function normalizeGradingRubric(
  partial?: Partial<GradingRubricConfig> | null,
): GradingRubricConfig {
  if (!partial) return { ...DEFAULT_GRADING_RUBRIC };
  return {
    reviewCount: positiveInt(partial.reviewCount, DEFAULT_GRADING_RUBRIC.reviewCount),
    reviewPointsEach: positiveInt(
      partial.reviewPointsEach,
      DEFAULT_GRADING_RUBRIC.reviewPointsEach,
    ),
    mcBankSize: positiveInt(partial.mcBankSize, DEFAULT_GRADING_RUBRIC.mcBankSize),
    mcTargetCorrect: positiveInt(
      partial.mcTargetCorrect,
      DEFAULT_GRADING_RUBRIC.mcTargetCorrect,
    ),
    mcPointsEach: positiveInt(partial.mcPointsEach, DEFAULT_GRADING_RUBRIC.mcPointsEach),
    fibCount: positiveInt(partial.fibCount, DEFAULT_GRADING_RUBRIC.fibCount),
    fibPointsEach: positiveInt(partial.fibPointsEach, DEFAULT_GRADING_RUBRIC.fibPointsEach),
    extraCount: positiveInt(partial.extraCount, DEFAULT_GRADING_RUBRIC.extraCount),
    extraPointsEach: positiveInt(
      partial.extraPointsEach,
      DEFAULT_GRADING_RUBRIC.extraPointsEach,
    ),
    freeResponseCount: positiveInt(
      partial.freeResponseCount,
      DEFAULT_GRADING_RUBRIC.freeResponseCount,
    ),
    freeResponsePoints: positiveInt(
      partial.freeResponsePoints,
      DEFAULT_GRADING_RUBRIC.freeResponsePoints,
    ),
    defaultGraduationProblemCount: positiveInt(
      partial.defaultGraduationProblemCount,
      DEFAULT_GRADING_RUBRIC.defaultGraduationProblemCount,
    ),
  };
}

function positiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : fallback;
}
