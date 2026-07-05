import { EMPTY_TEXTBOOK_READINGS } from "@/lib/utils/collections";

export type TextbookReading = {
  section: string;
  title: string;
  pages: string;
};

export type Textbook = {
  title: string;
  subtitle: string;
  authors: string;
  edition: string;
  publisher: string;
  coverSrc: string;
  coverAlt: string;
};

const BIOLOGY_TEXTBOOK: Textbook = {
  title: "Life Science",
  subtitle: "A Biological Approach",
  authors: "Elena Morris & James Okonkwo",
  edition: "2nd Edition",
  publisher: "Clearwater Academic Press",
  coverSrc: "/textbooks/biology-fundamentals-cover.svg",
  coverAlt: "Cover of Life Science: A Biological Approach, Second Edition",
};

/** Default companion textbooks bundled with the seed curriculum. */
export const SEED_TEXTBOOKS: Record<string, Textbook> = {
  "biology-year-1": BIOLOGY_TEXTBOOK,
};

const TEXTBOOKS: Record<string, Textbook> = SEED_TEXTBOOKS;

const LESSON_READINGS: Record<string, TextbookReading[]> = {
  "scientific-method": [
    { section: "§1.1", title: "What is science?", pages: "pp. 2–8" },
    { section: "§1.2", title: "Hypotheses and experiments", pages: "pp. 9–14" },
    { section: "§1.3", title: "Analyzing data", pages: "pp. 15–18" },
  ],
  "lab-safety": [
    { section: "§1.4", title: "Safety in the science classroom", pages: "pp. 19–23" },
    { section: "§1.5", title: "Measurement and units", pages: "pp. 24–28" },
  ],
  "cells-introduction": [
    { section: "§2.1", title: "Cell theory", pages: "pp. 34–42" },
    { section: "§2.2", title: "Prokaryotic and eukaryotic cells", pages: "pp. 43–52" },
  ],
  "cell-membrane": [
    { section: "§2.3", title: "Membrane structure", pages: "pp. 53–61" },
    { section: "§2.4", title: "Transport across membranes", pages: "pp. 62–71" },
  ],
  photosynthesis: [
    { section: "§3.1", title: "Light and chlorophyll", pages: "pp. 78–86" },
    { section: "§3.2", title: "The Calvin cycle", pages: "pp. 87–96" },
  ],
  "cellular-respiration": [
    { section: "§3.3", title: "Glycolysis and fermentation", pages: "pp. 97–105" },
    { section: "§3.4", title: "The Krebs cycle and electron transport", pages: "pp. 106–115" },
  ],
  "genetics-intro": [
    { section: "§4.1", title: "DNA structure", pages: "pp. 122–131" },
    { section: "§4.2", title: "From genes to proteins", pages: "pp. 132–140" },
    { section: "§4.3", title: "Mendelian inheritance", pages: "pp. 141–148" },
  ],
  ecosystems: [
    { section: "§5.1", title: "Energy in ecosystems", pages: "pp. 156–165" },
    { section: "§5.2", title: "Populations and communities", pages: "pp. 166–174" },
  ],
};

export function getTextbook(courseId: string): Textbook | undefined {
  return TEXTBOOKS[courseId];
}

export function getLessonReadings(lessonId: string): TextbookReading[] {
  return LESSON_READINGS[lessonId] ?? EMPTY_TEXTBOOK_READINGS;
}

export function getTextbookDisplayTitle(textbook: Textbook): string {
  return `${textbook.title}: ${textbook.subtitle}`;
}

export function buildTextbookCoverAlt(title: string, subtitle: string): string {
  const fullTitle = subtitle.trim() ? `${title}: ${subtitle}` : title;
  return `Cover of ${fullTitle}`;
}

export function createEmptyTextbook(): Textbook {
  return {
    title: "",
    subtitle: "",
    authors: "",
    edition: "",
    publisher: "",
    coverSrc: "",
    coverAlt: "",
  };
}
