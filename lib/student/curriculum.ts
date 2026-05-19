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

const BIOLOGY_LESSONS: CurriculumLesson[] = [
  {
    id: "scientific-method",
    unitId: "unit-1",
    unitTitle: "Unit 1 · Foundations of science",
    title: "The scientific method",
    description: "Ask questions, form hypotheses, and design fair tests.",
    order: 1,
  },
  {
    id: "lab-safety",
    unitId: "unit-1",
    unitTitle: "Unit 1 · Foundations of science",
    title: "Lab safety and measurement",
    description: "Units, tools, and safe practices in the lab.",
    order: 2,
  },
  {
    id: "cells-introduction",
    unitId: "unit-2",
    unitTitle: "Unit 2 · Cells and organelles",
    title: "Introduction to cells",
    description: "Cell theory, prokaryotes vs eukaryotes, and basic structures.",
    order: 3,
  },
  {
    id: "cell-membrane",
    unitId: "unit-2",
    unitTitle: "Unit 2 · Cells and organelles",
    title: "The cell membrane",
    description: "Structure, transport, and homeostasis across the membrane.",
    order: 4,
  },
  {
    id: "photosynthesis",
    unitId: "unit-3",
    unitTitle: "Unit 3 · Energy in living systems",
    title: "Photosynthesis",
    description: "How plants capture light energy and build sugars.",
    order: 5,
  },
  {
    id: "cellular-respiration",
    unitId: "unit-3",
    unitTitle: "Unit 3 · Energy in living systems",
    title: "Cellular respiration",
    description: "ATP production and the role of mitochondria.",
    order: 6,
  },
  {
    id: "genetics-intro",
    unitId: "unit-4",
    unitTitle: "Unit 4 · Heredity",
    title: "Introduction to genetics",
    description: "DNA, genes, and Mendelian inheritance patterns.",
    order: 7,
  },
  {
    id: "ecosystems",
    unitId: "unit-5",
    unitTitle: "Unit 5 · Ecology",
    title: "Ecosystems and energy flow",
    description: "Food webs, trophic levels, and population interactions.",
    order: 8,
  },
];

export const COURSES: Course[] = [
  {
    id: "biology-year-1",
    title: "Biology · Year 1",
    subject: "Life science",
    description:
      "A full-year introduction to biology—cells, energy, genetics, and ecology.",
    lessons: BIOLOGY_LESSONS,
  },
];

export const DEFAULT_COURSE_ID = "biology-year-1";

export function getCourse(courseId: string): Course | undefined {
  return COURSES.find((c) => c.id === courseId);
}

export function getLesson(courseId: string, lessonId: string): CurriculumLesson | undefined {
  return getCourse(courseId)?.lessons.find((l) => l.id === lessonId);
}

export function getLessonsByUnit(course: Course) {
  const units = new Map<string, { unitTitle: string; lessons: CurriculumLesson[] }>();
  for (const lesson of course.lessons) {
    const existing = units.get(lesson.unitId);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      units.set(lesson.unitId, {
        unitTitle: lesson.unitTitle,
        lessons: [lesson],
      });
    }
  }
  return Array.from(units.entries()).map(([unitId, data]) => ({
    unitId,
    unitTitle: data.unitTitle,
    lessons: data.lessons,
  }));
}

export function getAdjacentLessons(courseId: string, lessonId: string) {
  const course = getCourse(courseId);
  if (!course) return { prev: undefined, next: undefined };
  const index = course.lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? course.lessons[index - 1] : undefined,
    next: index < course.lessons.length - 1 ? course.lessons[index + 1] : undefined,
  };
}
