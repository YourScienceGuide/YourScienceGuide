import { buildFlashcardTemplateCsv } from "@/lib/admin/csv-flashcards";
import {
  buildTemplateCsv,
  type CsvImportKind,
} from "@/lib/admin/csv-questions";
import { buildReviewTemplateCsv } from "@/lib/admin/csv-review-questions";

export type TemplateKind = CsvImportKind | "flashcards" | "review";

export function buildQuestionTemplateCsv(kind: TemplateKind): string {
  if (kind === "flashcards") return buildFlashcardTemplateCsv();
  if (kind === "review") return buildReviewTemplateCsv();
  return buildTemplateCsv(kind);
}

export function questionTemplateFilename(kind: TemplateKind): string {
  if (kind === "flashcards") return "ysg-flashcards-template.csv";
  if (kind === "review") return "ysg-review-questions-template.csv";
  if (kind === "alcumus") return "ysg-alcumus-template.csv";
  if (kind === "end-of-chapter") return "ysg-end-of-chapter-template.csv";
  return "ysg-chapter-questions-template.csv";
}
