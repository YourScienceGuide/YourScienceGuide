export type CurriculumLesson = {
  id: string;
  unitId: string;
  unitTitle: string;
  title: string;
  description: string;
  order: number;
};

export type Course = {
  id: string;
  title: string;
  subject: string;
  description: string;
  lessons: CurriculumLesson[];
};
