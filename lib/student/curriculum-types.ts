export type CurriculumLesson = {
  id: string;
  unitId: string;
  unitTitle: string;
  title: string;
  description: string;
  order: number;
  /** Matches the Chapter column in bulk-import CSV files. */
  chapter?: number;
  /** Matches the Section column in bulk-import CSV files. */
  section?: number;
};

export type Course = {
  id: string;
  title: string;
  subject: string;
  description: string;
  lessons: CurriculumLesson[];
};
