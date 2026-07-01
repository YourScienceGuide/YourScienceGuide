import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
import { sortOrderForLesson } from "@/lib/student/lesson-sort";

function seedLesson(
  lesson: Omit<CurriculumLesson, "order"> & { order?: number },
): CurriculumLesson {
  const withSort = {
    ...lesson,
    order: lesson.order ?? sortOrderForLesson(lesson as CurriculumLesson),
  };
  return withSort;
}

export const SEED_LESSONS: CurriculumLesson[] = [
  seedLesson({
    id: "scientific-method",
    chapterId: "chapter-1",
    chapterTitle: "Chapter 1 · Foundations of science",
    title: "The scientific method",
    description: "Ask questions, form hypotheses, and design fair tests.",
    chapter: 1,
    section: 1,
  }),
  seedLesson({
    id: "lab-safety",
    chapterId: "chapter-1",
    chapterTitle: "Chapter 1 · Foundations of science",
    title: "Lab safety and measurement",
    description: "Units, tools, and safe practices in the lab.",
    chapter: 1,
    section: 2,
  }),
  seedLesson({
    id: "cells-introduction",
    chapterId: "chapter-2",
    chapterTitle: "Chapter 2 · Cells and organelles",
    title: "Introduction to cells",
    description: "Cell theory, prokaryotes vs eukaryotes, and basic structures.",
    chapter: 2,
    section: 1,
  }),
  seedLesson({
    id: "cell-membrane",
    chapterId: "chapter-2",
    chapterTitle: "Chapter 2 · Cells and organelles",
    title: "The cell membrane",
    description: "Structure, transport, and homeostasis across the membrane.",
    chapter: 2,
    section: 2,
  }),
  seedLesson({
    id: "photosynthesis",
    chapterId: "chapter-3",
    chapterTitle: "Chapter 3 · Energy in living systems",
    title: "Photosynthesis",
    description: "How plants capture light energy and build sugars.",
    chapter: 3,
    section: 1,
  }),
  seedLesson({
    id: "cellular-respiration",
    chapterId: "chapter-3",
    chapterTitle: "Chapter 3 · Energy in living systems",
    title: "Cellular respiration",
    description: "ATP production and the role of mitochondria.",
    chapter: 3,
    section: 2,
  }),
  seedLesson({
    id: "genetics-intro",
    chapterId: "chapter-4",
    chapterTitle: "Chapter 4 · Heredity",
    title: "Introduction to genetics",
    description: "DNA, genes, and Mendelian inheritance patterns.",
    chapter: 4,
    section: 1,
  }),
  seedLesson({
    id: "ecosystems",
    chapterId: "chapter-5",
    chapterTitle: "Chapter 5 · Ecology",
    title: "Ecosystems and energy flow",
    description: "Food webs, trophic levels, and population interactions.",
    chapter: 5,
    section: 1,
  }),
];

export const SEED_COURSES: Course[] = [
  {
    id: "biology-year-1",
    title: "Biology · Year 1",
    subject: "Life science",
    description:
      "A full-year introduction to biology—cells, energy, genetics, and ecology.",
    lessons: SEED_LESSONS,
  },
];

export const DEFAULT_COURSE_ID = SEED_COURSES[0].id;
