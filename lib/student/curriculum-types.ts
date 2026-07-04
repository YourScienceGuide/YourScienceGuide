export type LessonAccessTier = "preview" | "subscriber";

export type CurriculumLesson = {
  id: string;
  chapterId: string;
  chapterTitle: string;
  title: string;
  description: string;
  order: number;
  /** Matches the Chapter column in bulk-import CSV files. */
  chapter?: number;
  /** Matches the Section column in bulk-import CSV files. */
  section?: number;
  /** Preview lessons are open without an account; subscriber lessons are paywalled. */
  accessTier?: LessonAccessTier;
  /** Override course default; problems solved to graduate this section. */
  graduationProblemCount?: number;
};

export type Course = {
  id: string;
  title: string;
  subject: string;
  description: string;
  lessons: CurriculumLesson[];
};
